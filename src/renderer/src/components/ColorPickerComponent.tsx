import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { colors } from "@/consts";
import { cn } from "@/lib/utils";
import _ from "lodash/fp";
import React, { useEffect, useMemo, useState, memo } from "react";
import { HexColorPicker } from "react-colorful";

type ColorPickerComponentProps = {
  handleColorChange: (value: string) => void;
  pickedColor?: string | null;
};

const ColorPickerComponent: React.FC<ColorPickerComponentProps> = memo(
  ({ handleColorChange, pickedColor }) => {
    const [openHexColorPicker, setOpenHexColorPicker] = useState(false);
    const [pickedColorHex, setPickedColorHex] = useState<string>();
    const [isPicketColorHexSelected, setIsPicketColorHexSelected] =
      useState(false);

    const defaultValue = useMemo(() => {
      return pickedColor ?? colors[_.random(colors.length - 1, false)];
    }, [pickedColor]);

    useEffect(() => {
      if (!pickedColor && defaultValue) {
        handleColorChange(defaultValue);
      }
    }, [defaultValue, handleColorChange, pickedColor]);

    const handleColorPickerClick = () => {
      setOpenHexColorPicker(true);
    };

    const handleRadioButtonClick = (color: string) => {
      setIsPicketColorHexSelected(false);
      handleColorChange(color);
    };

    const customColorValueChange = (color: string) => {
      setIsPicketColorHexSelected(true);
      setPickedColorHex(color);
      handleColorChange(color);
    };

    return (
      <div className="flex flex-col gap-4 pt-4">
        <div className="flex justify-center gap-4">
          {colors.map((color) => (
            <div
              tabIndex={0}
              role="button"
              style={{ color, borderColor: color, backgroundColor: color }}
              className={cn(
                "h-4 w-4 cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-4 focus-visible:ring-offset-0 dark:focus-visible:ring-dark-gray-1",
                pickedColor === color &&
                  "ring-2 ring-gray-4 ring-offset-2 ring-offset-transparent dark:ring-dark-gray-1",
              )}
              id={color}
              key={color}
              onKeyDown={(e) => {
                (e.key === "Enter" || e.key === " ") &&
                  handleRadioButtonClick(color);
              }}
              onClick={() => handleRadioButtonClick(color)}
            />
          ))}
          <Popover
            open={openHexColorPicker}
            onOpenChange={setOpenHexColorPicker}
            modal
          >
            <PopoverTrigger asChild>
              <div
                onClick={handleColorPickerClick}
                onKeyDown={(e) => {
                  (e.key === "Enter" || e.key === " ") &&
                    handleColorPickerClick();
                }}
                tabIndex={0}
                role="button"
                style={{ backgroundColor: pickedColorHex }}
                className={cn(
                  "h-4 w-4 cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-4 focus-visible:ring-offset-0 dark:focus-visible:ring-dark-gray-1",
                  pickedColorHex &&
                    isPicketColorHexSelected &&
                    "ring-2 ring-gray-4 ring-offset-2 ring-offset-transparent dark:ring-dark-gray-1",
                  !pickedColorHex &&
                    "bg-gradient-to-br from-amber-200 to-indigo-400",
                )}
              />
            </PopoverTrigger>
            <PopoverContent className="w-fit space-y-2">
              <HexColorPicker
                color={defaultValue}
                onChange={customColorValueChange}
              />
              <Button
                variant="default"
                onClick={() => setOpenHexColorPicker(false)}
              >
                OK
              </Button>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    );
  },
);

ColorPickerComponent.displayName = "ColorPickerComponent";

export default ColorPickerComponent;
