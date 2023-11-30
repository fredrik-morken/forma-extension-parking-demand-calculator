import { Forma } from "forma-embedded-view-sdk/auto";
import { useEffect, useMemo, useState } from "react";

//@ts-ignore
import { FunctionBreakdownMetric } from "forma-embedded-view-sdk/dist/internal/areaMetrics";

const LOCAL_STORAGE_KEY = "parking-demand-extension";
const getLocalStorage = (): Record<string, number> => {
  const value = localStorage.getItem(LOCAL_STORAGE_KEY);
  return value ? JSON.parse(value) : ({} as Record<string, number>);
};

const setLocalStorage = (value: Record<string, number>): void => {
  return localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(value));
};

function round(value: number) {
  return Math.round(value);
}

function SqmPerSpotPerFunction({
  sqm,
  setSqm,
}: {
  sqm: number;
  setSqm: (demand: number) => void;
}) {
  function onInput(event: Event) {
    const { value } = event.target as HTMLInputElement;
    if (isNaN(Number(value))) {
      return;
    }
    setSqm(Number(value));
  }

  return (
    /* @ts-ignore */
    <weave-input
      class="sqm-input"
      onInput={onInput}
      type="number"
      value={sqm || 0}
      unit="m²"
    />
  );
}

function Floating() {
  return <p>The floating panel</p>;
}

export function App() {
  const floating = new URLSearchParams(window.location.search).get("floating");
  if (floating) {
    return <Floating />;
  }
  return <RightPanel />;
}

function RightPanel() {
  const [gfaPerFunction, setGfaPerFunction] = useState<
    FunctionBreakdownMetric[]
  >([]);

  const [noOfSpots, setNoOfSpots] = useState<number>(0);

  const [sqmPerSpotPerFunction, setSqmPerSpotPerFunction] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    Forma.areaMetrics.calculate({}).then((metrics) => {
      const functionBreakdownMetrics =
        metrics.builtInMetrics.grossFloorArea.functionBreakdown.filter(
          (func) => func.functionId != "unspecified",
        );
      setGfaPerFunction(functionBreakdownMetrics);
      const sqmPerSpotPerFunction = Object.fromEntries(
        functionBreakdownMetrics.map((metric) => [metric.functionId, 50]),
      );

      if (!localStorage.getItem(LOCAL_STORAGE_KEY)) {
        setSqmPerSpotPerFunction(sqmPerSpotPerFunction);
        setLocalStorage(sqmPerSpotPerFunction);
      } else {
        setSqmPerSpotPerFunction(getLocalStorage());
      }
      //@ts-ignore
      setNoOfSpots(metrics.parkingStatistics!.spots);
    });
  }, []);

  const demandPerFunction: Record<string, number> = useMemo(() => {
    const demandPerFunction: Record<string, number> = {};
    gfaPerFunction.forEach((metric) => {
      const sqmPerSpot = sqmPerSpotPerFunction[metric.functionId];
      console.log("sqm per spot input: ", sqmPerSpot);
      if (!sqmPerSpot) {
        demandPerFunction[metric.functionId] = 0;
      } else {
        demandPerFunction[metric.functionId] = round(
          metric.value / sqmPerSpotPerFunction[metric.functionId],
        );
      }
    });
    return demandPerFunction;
  }, [sqmPerSpotPerFunction]);

  function setSqmPerSpotForFunction(
    functionId: string,
  ): (demand: number) => void {
    return function (demand: number) {
      setSqmPerSpotPerFunction((prev) => {
        const newSqmPerSpot = { ...prev, [functionId]: demand };
        setLocalStorage(newSqmPerSpot);
        return { ...prev, [functionId]: demand };
      });
    };
  }

  const totalDemand = useMemo(() => {
    return Object.values(demandPerFunction).reduce(
      (acc, curr) => acc + curr,
      0,
    );
  }, [demandPerFunction]);

  const difference = useMemo(() => {
    return noOfSpots - totalDemand;
  }, [totalDemand, noOfSpots]);
  return (
    <div class="wrapper">
      <p class="header">Parking demand</p>
      {gfaPerFunction.map((metric) => {
        return (
          <div class="setting-row">
            <div
              class="setting-row-function-color"
              style={`background: ${metric.functionColor}`}
            ></div>
            <div class="setting-row-function-name">{metric.functionName}</div>
            <div>1 p. /</div>
            <SqmPerSpotPerFunction
              setSqm={setSqmPerSpotForFunction(metric.functionId)}
              sqm={sqmPerSpotPerFunction[metric.functionId]}
            />
          </div>
        );
      })}
      <hr class="divider" />
      <div
        class="stats-row"
        style={{ display: "flex", alignItems: "center", fontSize: "11px" }}
      >
        <span>Parking spots</span>{" "}
        <div style={{ width: "65px" }}>
          <div
            style={{
              paddingLeft: "3px",
              height: "6px",
              width: "100%",
              backgroundColor: "#f5f5f5",
            }}
          >
            <div
              style={{
                height: "6px",
                width: `${Math.min((noOfSpots / totalDemand) * 100, 100)}%`,
                backgroundColor: "#0696D7",
              }}
            />
          </div>
        </div>
        <span>
          {noOfSpots} / {round(totalDemand)}
        </span>
      </div>
      <p className="stats-row" style={{ fontSize: "11px" }}>
        {difference > 0 && <span>Excess parking spots </span>}
        {difference < 0 && <span>Missing parking spots </span>}
        {difference != 0 && <span>{Math.abs(difference)}</span>}
      </p>
      {/*
      <button
        onClick={() => {
          return Forma.openFloatingPanel({
            embeddedViewId: "5e00e471-63ed-44a1-8406-cf2ab73408b9",
            url: "https://spacemakerai.github.io/parking-demand-extension/?floating=1",
          });
        }}
      >
        Open settings
      </button>
      */}
    </div>
  );
}
