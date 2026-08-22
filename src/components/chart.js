// ============================================================
// chart.js — SVG Chart Utilities
// ============================================================

/**
 * Render a bar chart into a container element
 * @param {HTMLElement} el - Container element
 * @param {Array} data - [{label, value, color?}]
 * @param {Object} opts
 */
export function renderBarChart(el, data, opts = {}) {
  const { height = 140, barColor = 'var(--color-primary)', showValues = true, showLabels = true } = opts;
  const max = Math.max(...data.map(d => d.value), 1);

  el.innerHTML = `
    <div class="chart-bar-wrap" style="height:${height}px">
      ${data.map(d => {
        const pct = Math.round((d.value / max) * 100);
        return `
          <div class="chart-bar-col">
            ${showValues ? `<div class="chart-bar-value">${formatNum(d.value)}</div>` : ''}
            <div class="chart-bar" style="height:${Math.max(pct, 2)}%;background:${d.color || barColor}"
              title="${d.label}: ${d.value}"></div>
            ${showLabels ? `<div class="chart-bar-label">${d.label}</div>` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Render a multi-series bar chart
 */
export function renderGroupedBarChart(el, data, series, opts = {}) {
  const { height = 140, colors = ['var(--color-primary)', 'var(--color-accent)', 'var(--color-warning)'] } = opts;
  const allValues = data.flatMap(d => series.map(s => d[s.key] || 0));
  const max = Math.max(...allValues, 1);

  el.innerHTML = `
    <div class="chart-bar-wrap" style="height:${height}px;gap:12px">
      ${data.map(d => `
        <div class="chart-bar-col">
          <div style="display:flex;align-items:flex-end;gap:3px;height:${height - 30}px;width:100%">
            ${series.map((s, i) => {
              const pct = Math.round(((d[s.key] || 0) / max) * 100);
              return `<div class="chart-bar" style="flex:1;height:${Math.max(pct, 2)}%;background:${colors[i]}" title="${s.label}: ${d[s.key] || 0}"></div>`;
            }).join('')}
          </div>
          <div class="chart-bar-label">${d.label}</div>
        </div>
      `).join('')}
    </div>
    <div class="chart-legend">
      ${series.map((s, i) => `
        <div class="chart-legend-item">
          <div class="chart-legend-dot" style="background:${colors[i]}"></div>
          ${s.label}
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Render a simple inline line chart as SVG
 */
export function renderLineChart(el, data, opts = {}) {
  const { width = 400, height = 100, color = 'var(--color-primary)', fill = true } = opts;
  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values, min + 1);
  const range = max - min;
  const step = width / (values.length - 1);

  const points = values.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * (height - 10) - 5;
    return `${x},${y}`;
  });

  const polyline = points.join(' ');
  const areaPath = `M${points[0]} L${polyline} L${(values.length - 1) * step},${height} L0,${height} Z`;

  el.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" class="chart-line-svg" preserveAspectRatio="none">
      ${fill ? `<path d="${areaPath}" fill="${color}" opacity="0.10"/>` : ''}
      <polyline points="${polyline}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      ${values.map((v, i) => `
        <circle cx="${i * step}" cy="${height - ((v - min) / range) * (height - 10) - 5}" r="3" fill="${color}" />
      `).join('')}
    </svg>
    <div class="chart-legend" style="justify-content:space-between">
      ${data.map(d => `<span style="font-size:10px;color:var(--color-text-muted)">${d.label}</span>`).join('')}
    </div>
  `;
}

/**
 * Render a donut chart
 */
export function renderDonutChart(el, data, opts = {}) {
  const { size = 120, strokeWidth = 20 } = opts;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((s, d) => s + d.value, 0);
  let offset = 0;

  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:20px">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="flex-shrink:0;transform:rotate(-90deg)">
        <circle cx="${size/2}" cy="${size/2}" r="${radius}" fill="none" stroke="var(--color-border)" stroke-width="${strokeWidth}"/>
        ${data.map(d => {
          const pct = d.value / total;
          const dash = pct * circumference;
          const gap = circumference - dash;
          const el = `<circle cx="${size/2}" cy="${size/2}" r="${radius}" fill="none"
            stroke="${d.color}" stroke-width="${strokeWidth}"
            stroke-dasharray="${dash} ${gap}"
            stroke-dashoffset="${-offset * circumference}"
            stroke-linecap="butt"/>`;
          offset += pct;
          return el;
        }).join('')}
      </svg>
      <div class="chart-legend" style="flex-direction:column;gap:6px">
        ${data.map(d => `
          <div class="chart-legend-item">
            <div class="chart-legend-dot" style="background:${d.color}"></div>
            <div>
              <span style="font-weight:600;color:var(--color-text)">${d.value}%</span>
              <span style="margin-left:4px">${d.label}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function formatNum(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
  return n;
}

export { formatNum };
