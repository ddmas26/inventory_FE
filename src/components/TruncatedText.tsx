import { Tooltip } from 'antd';
import type { CSSProperties } from 'react';
import { isTruncated, truncateText } from '../utils/text';

/** Characters shown before a title is shortened. Tune this to taste. */
export const DEFAULT_MAX_CHARS = 40;

interface TruncatedTextProps {
  text?: string | null;
  /** Characters shown before the text is shortened. */
  maxChars?: number;
  /** Show the full text on hover even when it isn't shortened. */
  alwaysShowTooltip?: boolean;
  style?: CSSProperties;
}

/**
 * Renders a single line of text, shortened to `maxChars` characters. When the
 * text is shortened, hovering shows the full value in a tooltip so nothing is
 * lost — it just stops long product names from stretching the table.
 */
export default function TruncatedText({
  text,
  maxChars = DEFAULT_MAX_CHARS,
  alwaysShowTooltip = false,
  style,
}: TruncatedTextProps) {
  const value = text ?? '';
  const shortened = isTruncated(value, maxChars);

  if (!shortened && !alwaysShowTooltip) {
    return <span style={style}>{value}</span>;
  }

  return (
    <Tooltip title={value} placement="topLeft" mouseEnterDelay={0.3}>
      <span style={{ cursor: 'default', ...style }}>
        {shortened ? truncateText(value, maxChars) : value}
      </span>
    </Tooltip>
  );
}
