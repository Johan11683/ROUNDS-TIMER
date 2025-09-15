import React from "react";
import { DndContext, closestCenter, useSensor, useSensors, MouseSensor, TouchSensor, DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RoundConfig } from "../hooks/useRoundTimer";

interface CustomSettingsProps {
  rounds: RoundConfig[];
  onChange(rounds: RoundConfig[]): void;
  onStartAt(index: number): void;
  onAddRound(): void;
}

const SortableItem: React.FC<{
  id: string;
  index: number;
  round: RoundConfig;
  rounds: RoundConfig[];
  onChange: (next: RoundConfig[]) => void;
}> = ({ id, index, round, rounds, onChange }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: "grab",
  };

  const update = (key: keyof RoundConfig, value: number) => {
    const next = rounds.slice();
    next[index] = { ...next[index], [key]: value };
    onChange(next);
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="custom__row">
      <button
        className="danger btn-icon small"
        onClick={() => {
          const next = rounds.slice();
          next.splice(index, 1);
          onChange(next);
        }}
      >
        ✕
      </button>
      <div className="grow">
        <label>round {index + 1}</label>
        <input
          type="number"
          min={10}
          max={1800}
          step={5}
          value={round.workSeconds}
          onChange={(e) => update("workSeconds", Number(e.target.value))}
        />
      </div>
      <div className="grow">
        <label>pause</label>
        <input
          type="number"
          min={0}
          max={900}
          step={5}
          value={round.restSeconds}
          onChange={(e) => update("restSeconds", Number(e.target.value))}
        />
      </div>
    </div>
  );
};

export const CustomSettings: React.FC<CustomSettingsProps> = ({
  rounds,
  onChange,
  onAddRound,
}) => {
  // capteurs avec délai d'activation de 1s
  const mouseSensor = useSensor(MouseSensor, { activationConstraint: { delay: 200, tolerance: 5 } });
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } });
  const sensors = useSensors(mouseSensor, touchSensor);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = rounds.findIndex((_, i) => String(i) === active.id);
      const newIndex = rounds.findIndex((_, i) => String(i) === over.id);
      const next = arrayMove(rounds, oldIndex, newIndex);
      onChange(next);
    }
  };

  return (
    <div className="custom">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <button className="btn-icon" onClick={onAddRound}>
          +
        </button>
      </div>
      <div className="custom__scroller">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={rounds.map((_, i) => String(i))}
            strategy={verticalListSortingStrategy}
          >
            {rounds.map((r, i) => (
              <SortableItem
                key={i}
                id={String(i)}
                index={i}
                round={r}
                rounds={rounds}
                onChange={onChange}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};
