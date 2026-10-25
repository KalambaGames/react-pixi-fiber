import { FancyButton, CheckBox as PixiCheckBox, Slider as PixiSlider, ScrollBox } from "@pixi/ui";
import { Graphics, Text as PixiText } from "pixi.js";
import { useState } from "react";
import { PIXIComponent, Stage, Text } from "react-pixi-fiber";

const textStyle = { fill: "white", fontFamily: "Arial", fontSize: 16 } as const;
const rounded = (width: number, height: number, color: number, radius = 8) =>
  new Graphics().roundRect(0, 0, width, height, radius).fill(color);
const button = (width: number, text: string, anchor = 0.5) =>
  new FancyButton({
    anchor,
    // A button scales around its anchor, so only a centered button grows on hover.
    animations:
      anchor === 0.5
        ? {
            hover: { duration: 100, props: { scale: { x: 1.05, y: 1.05 } } },
            pressed: { duration: 100, props: { scale: { x: 0.95, y: 0.95 } } },
          }
        : undefined,
    defaultView: rounded(width, 32, 0x2f8f5b),
    hoverView: rounded(width, 32, 0x3aa56c),
    pressedView: rounded(width, 32, 0x267a4c),
    text: new PixiText({ style: textStyle, text }),
  });

// The widgets report changes through signals. Each component connects its signal once, when it creates the widget,
// and the signal calls the latest callback prop.
const callbacks = new WeakMap<object, (value: never) => void>();

type ButtonProps = { onPress: () => void; text: string };

const Button = PIXIComponent<FancyButton, ButtonProps>("Button", {
  create: ({ text }) => {
    const instance = button(90, text);
    instance.onPress.connect(() => callbacks.get(instance)?.(undefined as never));
    return instance;
  },
  applyProps: function (instance, oldProps, newProps) {
    const { onPress, text, ...newPropsRest } = newProps;
    const { onPress: oldOnPress, text: oldText, ...oldPropsRest }: Partial<ButtonProps> = oldProps || {};
    callbacks.set(instance, onPress);
    this.applyDisplayObjectProps(oldPropsRest, newPropsRest);
  },
});

type CheckBoxProps = { checked: boolean; label: string; onChange: (checked: boolean) => void };

const box = (checked: boolean) => {
  const graphics = rounded(24, 24, 0x0b3d5c, 4);
  return checked ? graphics.roundRect(5, 5, 14, 14, 2).fill(0xffd34d) : graphics;
};

const CheckBox = PIXIComponent<PixiCheckBox, CheckBoxProps>("CheckBox", {
  create: ({ label }) => {
    const instance = new PixiCheckBox({
      style: { checked: box(true), text: textStyle, unchecked: box(false) },
      text: label,
    });
    instance.onCheck.connect(checked => callbacks.get(instance)?.(checked as never));
    return instance;
  },
  applyProps: function (instance, oldProps, newProps) {
    const { checked, label, onChange, ...newPropsRest } = newProps;
    const {
      checked: oldChecked,
      label: oldLabel,
      onChange: oldOnChange,
      ...oldPropsRest
    }: Partial<CheckBoxProps> = oldProps || {};
    callbacks.set(instance, onChange);
    // A controlled widget: the state sets the checkbox without emitting the signal again.
    if (instance.checked !== checked) instance.forceCheck(checked);
    this.applyDisplayObjectProps(oldPropsRest, newPropsRest);
  },
});

type ListProps = { items: string[]; onSelect: (item: string) => void };

const List = PIXIComponent<ScrollBox, ListProps>("List", {
  create: ({ items }) => {
    const instance = new ScrollBox({
      background: 0x0b3d5c,
      elementsMargin: 6,
      height: 200,
      padding: 8,
      radius: 8,
      width: 150,
    });
    instance.addItems(
      items.map(item => {
        // The list places its rows from their top left corner.
        const row = button(134, item, 0);
        row.onPress.connect(() => callbacks.get(instance)?.(item as never));
        return row;
      })
    );
    return instance;
  },
  applyProps: function (instance, oldProps, newProps) {
    const { items, onSelect, ...newPropsRest } = newProps;
    const { items: oldItems, onSelect: oldOnSelect, ...oldPropsRest }: Partial<ListProps> = oldProps || {};
    callbacks.set(instance, onSelect);
    this.applyDisplayObjectProps(oldPropsRest, newPropsRest);
  },
});

type SliderProps = { onChange: (value: number) => void; value: number };

const Slider = PIXIComponent<PixiSlider, SliderProps>("Slider", {
  create: () => {
    const instance = new PixiSlider({
      bg: rounded(180, 10, 0x0b3d5c, 5),
      fill: rounded(180, 10, 0xffd34d, 5),
      max: 100,
      min: 0,
      slider: new Graphics().circle(0, 0, 11).fill(0xffffff),
    });
    instance.onUpdate.connect(value => callbacks.get(instance)?.(value as never));
    return instance;
  },
  applyProps: function (instance, oldProps, newProps) {
    const { onChange, value, ...newPropsRest } = newProps;
    const { onChange: oldOnChange, value: oldValue, ...oldPropsRest }: Partial<SliderProps> = oldProps || {};
    callbacks.set(instance, onChange);
    if (instance.value !== value) instance.value = value;
    this.applyDisplayObjectProps(oldPropsRest, newPropsRest);
  },
});

const levels = Array.from({ length: 20 }, (_, index) => `Level ${index + 1}`);
const defaults = { level: levels[0], music: true, volume: 70 };

// A settings screen. React state holds the settings, so Reset moves the widgets back and Save knows what changed.
export default function UIExample() {
  const [settings, setSettings] = useState(defaults);
  const [saved, setSaved] = useState(defaults);
  const change = (update: Partial<typeof defaults>) => setSettings(current => ({ ...current, ...update }));
  const unsaved = JSON.stringify(settings) !== JSON.stringify(saved);

  return (
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
      <Text style={{ ...textStyle, fontSize: 22, fontWeight: "bold" }} text="SETTINGS" x={20} y={16} />
      <Text style={textStyle} text={`Volume: ${settings.volume}`} x={20} y={64} />
      <Slider onChange={volume => change({ volume })} value={settings.volume} x={20} y={96} />
      <CheckBox checked={settings.music} label="Music" onChange={music => change({ music })} x={20} y={130} />
      <Text style={textStyle} text={`Start at: ${settings.level}`} x={20} y={176} />
      <Text
        style={{ ...textStyle, fill: unsaved ? 0xffd34d : "white" }}
        text={unsaved ? "Unsaved changes" : "Saved"}
        x={20}
        y={204}
      />
      <Button onPress={() => setSettings(defaults)} text="Reset" x={65} y={262} />
      <Button onPress={() => setSaved(settings)} text="Save" x={165} y={262} />
      <Text style={textStyle} text="Start level" x={230} y={24} />
      <List items={levels} onSelect={level => change({ level })} x={230} y={56} />
    </Stage>
  );
}
