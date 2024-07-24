import React, { useState } from "react";

interface ToggleSliderProps {
  label: string;
  initialState: boolean;
  onToggle: (toggle: boolean) => void;
}

export const ToggleSlider = ({
  label,
  initialState = false,
  onToggle,
}: ToggleSliderProps) => {
  const [isOn, setIsOn] = useState(initialState);

  const handleToggle = () => {
    setIsOn(!isOn);
    if (onToggle) {
      onToggle(!isOn);
    }
  };

  return (
    <div>
      <label className="toggle-slider">
        <input type="checkbox" checked={isOn} onChange={handleToggle} />
        <span className="slider"></span>
      </label>
      <span>{label}</span>
    </div>
  );
};

export default ToggleSlider;
