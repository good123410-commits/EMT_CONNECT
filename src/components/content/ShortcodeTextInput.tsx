import { forwardRef, useMemo, useRef, useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import { ShortcodePickerOverlay } from '@/components/content/ShortcodePickerOverlay';
import { useShortcodeRegistry } from '@/contexts/ShortcodeRegistryContext';
import { useCanUseAdminShortcodes } from '@/hooks/useCanUseAdminShortcodes';
import { useShortcodePickerAnchor } from '@/hooks/useShortcodePickerAnchor';
import { filterShortcodesForPicker } from '@/services/shortcodeService';
import type { ContentShortcode, ShortcodePickerMode } from '@/types/shortcode';
import {
  detectShortcodePickerTrigger,
  estimateCursorAfterTextChange,
  insertShortcodeIntoText,
  type ShortcodeTriggerMatch,
} from '@/utils/shortcodeComposerUtils';

function resolveContainerStyle(style: TextInputProps['style']): ViewStyle {
  const flat = StyleSheet.flatten(style);
  const container: ViewStyle = { position: 'relative' };

  if (!flat) return container;

  if (typeof flat.flex === 'number') container.flex = flat.flex;
  if (typeof flat.flexGrow === 'number') container.flexGrow = flat.flexGrow;
  if (typeof flat.alignSelf === 'string') container.alignSelf = flat.alignSelf;
  if (typeof flat.width === 'number' || typeof flat.width === 'string') container.width = flat.width;
  if (typeof flat.minWidth === 'number' || typeof flat.minWidth === 'string') {
    container.minWidth = flat.minWidth;
  }

  return container;
}

export const ShortcodeTextInput = forwardRef<TextInput, TextInputProps>(function ShortcodeTextInput(
  { value = '', onChangeText, onSelectionChange, onFocus, onBlur, style, ...rest },
  ref,
) {
  const { shortcodes } = useShortcodeRegistry();
  const canUseAdminShortcodes = useCanUseAdminShortcodes();

  const selectionRef = useRef({ start: value.length, end: value.length });
  const triggerRef = useRef<ShortcodeTriggerMatch | null>(null);
  const [controlledSelection, setControlledSelection] = useState<
    { start: number; end: number } | undefined
  >(undefined);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState<ShortcodePickerMode>('user');

  const { anchorRef, anchor, measureAnchor } = useShortcodePickerAnchor(pickerVisible);

  const pickerItems = useMemo(
    () => filterShortcodesForPicker(shortcodes, pickerMode),
    [shortcodes, pickerMode],
  );

  const applySelection = (selection: { start: number; end: number }) => {
    selectionRef.current = selection;
    setControlledSelection(selection);
    requestAnimationFrame(() => setControlledSelection(undefined));
  };

  const closePicker = () => {
    setPickerVisible(false);
    triggerRef.current = null;
  };

  const openPicker = (mode: ShortcodePickerMode, trigger: ShortcodeTriggerMatch) => {
    triggerRef.current = trigger;
    setPickerMode(mode);
    setPickerVisible(true);
    requestAnimationFrame(measureAnchor);
  };

  const handleChangeText = (nextText: string) => {
    const previousText = value;
    const previousSelection = selectionRef.current;
    const cursor = estimateCursorAfterTextChange(previousText, nextText, previousSelection);
    selectionRef.current = { start: cursor, end: cursor };

    const trigger = detectShortcodePickerTrigger(nextText, cursor, canUseAdminShortcodes);
    if (trigger) {
      openPicker(trigger.mode, trigger);
    } else if (pickerVisible) {
      closePicker();
    }

    onChangeText?.(nextText);
  };

  const handleInsertShortcode = (shortcut: ContentShortcode) => {
    const result = insertShortcodeIntoText(
      value,
      shortcut.shortcut,
      triggerRef.current?.range ?? null,
    );
    applySelection(result.selection);
    onChangeText?.(result.text);
    closePicker();
  };

  const containerStyle = resolveContainerStyle(style);

  return (
    <View
      ref={anchorRef}
      style={containerStyle}
      collapsable={false}
      onLayout={() => {
        if (pickerVisible) measureAnchor();
      }}
    >
      <TextInput
        ref={ref}
        {...rest}
        style={style}
        value={value}
        selection={controlledSelection}
        onChangeText={handleChangeText}
        onSelectionChange={(event) => {
          selectionRef.current = event.nativeEvent.selection;
          onSelectionChange?.(event);
        }}
        onFocus={(event) => {
          if (pickerVisible) measureAnchor();
          onFocus?.(event);
        }}
        onBlur={onBlur}
      />
      <ShortcodePickerOverlay
        visible={pickerVisible}
        anchor={anchor}
        mode={pickerMode}
        items={pickerItems}
        onSelect={handleInsertShortcode}
        onClose={closePicker}
      />
    </View>
  );
});
