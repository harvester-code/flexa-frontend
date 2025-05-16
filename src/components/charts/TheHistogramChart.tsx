interface TheHistogramChartProps {
  chartData: any[];
}

function TheHistogramChart({ chartData }: TheHistogramChartProps) {
  return (
    <div className="mt-10 rounded-md bg-white">
      <div className="flex rounded-lg text-center">
        {chartData &&
          chartData?.map(({ title, value, color }, idx) => (
            <div style={{ width: `${value}%` }} key={idx}>
              <div
                className={`py-3.5 ${
                  chartData.length === 1
                    ? 'rounded-lg'
                    : idx === 0
                      ? 'rounded-l-lg'
                      : idx === chartData.length - 1
                        ? 'rounded-r-lg'
                        : ''
                }`}
                style={{ background: `${color}` }}
              >
                <p className="text-3xl font-bold text-white">{value}%</p>
              </div>
              <p className="mt-1 text-sm font-medium">{title}</p>
            </div>
          ))}
      </div>
    </div>
  );
}

export default TheHistogramChart;
