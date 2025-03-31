function CanvasInputs({ nodes, setNodes, rectangles, setRectangles, drawLines }) {
  return (
    <div className="mx-auto mt-6 flex w-[1280px] flex-col gap-4 overflow-hidden bg-gray-200 p-4">
      {nodes.map((node, idx) => (
        <div className="flex items-center gap-4" key={node.title}>
          <div>{node.title}</div>

          <div className="flex flex-col">
            <label htmlFor="lineCount">Circle Size:</label>
            <input
              id="circleSize"
              className="border border-green-600"
              type="number"
              value={node.circleSize}
              onChange={(e) => {
                setNodes((prev) => {
                  const updated = [...prev];
                  updated[idx] = { ...updated[idx], circleSize: Number(e.target.value) };
                  return updated;
                });
              }}
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="passengerCount">Passenger Count:</label>
            <input
              id="passengerCount"
              className="border border-blue-600"
              type="number"
              value={node.passengerCount}
              onChange={(e) => {
                setNodes((prev) => {
                  const updated = [...prev];
                  updated[idx] = { ...updated[idx], passengerCount: Number(e.target.value) };
                  return updated;
                });
              }}
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="lineCount">Line Count:</label>
            <input
              id="lineCount"
              className="border border-green-600"
              type="number"
              value={node.lineCount}
              onChange={(e) => {
                setNodes((prev) => {
                  const updated = [...prev];
                  updated[idx] = { ...updated[idx], lineCount: Number(e.target.value) };
                  return updated;
                });
              }}
            />
          </div>

          <button
            disabled={rectangles.length < idx + 1}
            className="bg-slate-300 px-4 py-2"
            onClick={() => drawLines(idx)}
          >
            Apply
          </button>

          <button
            disabled={rectangles.length !== idx + 1}
            className="bg-rose-300 px-4 py-2"
            onClick={() => {
              setRectangles((prev) => {
                const updatedRectangles = [...prev];
                updatedRectangles.splice(idx, 1);
                return updatedRectangles;
              });
            }}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}

export default CanvasInputs;
