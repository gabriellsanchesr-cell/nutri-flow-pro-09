

# Fix: Truncated "Masculino" Legend in Sex Distribution Chart

## Problem
The `PieChart` label renderer uses `outerRadius={80}` with default label positioning, causing long text like "Masculino (100%)" to overflow and get clipped by the `ResponsiveContainer` bounds.

## Solution
In `src/components/relatorios/PacientesTab.tsx` (line 163):

1. Reduce `outerRadius` from `80` to `70` to give labels more room
2. Use a shorter label format: abbreviate to initials — `M`, `F`, `O` — followed by percentage, or use a `Legend` component below the chart instead of inline labels
3. Best approach: replace inline `label` with a `<Legend>` component from Recharts, which renders cleanly below the pie and never truncates

### Specific change
- Remove the `label` prop from `<Pie>`
- Add `<Legend />` component inside `<PieChart>` to show the legend below the chart with full names
- Increase container height from `220` to `260` to accommodate the legend

This ensures "Masculino", "Feminino", and "Outro" always display fully regardless of chart size.

