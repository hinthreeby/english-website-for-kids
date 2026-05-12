import { useMemo } from "react";

const StarBackground = () => {
  const stars = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() > 0.7 ? 2 : 1,
        duration: (Math.random() * 3 + 2).toFixed(2),
        delay: (Math.random() * 5).toFixed(2),
      })),
    [],
  );

  return (
    <>
      <div className="star-field" aria-hidden="true">
        {stars.map((star) => (
          <span
            key={star.id}
            className="space-star"
            style={{
              "--star-x": `${star.x}%`,
              "--star-y": `${star.y}%`,
              "--star-size": `${star.size}px`,
              "--star-duration": `${star.duration}s`,
              "--star-delay": `${star.delay}s`,
              background: "white",
            }}
          />
        ))}
      </div>
      <div className="floating-decorations" aria-hidden="true">
        <span className="float-star f1">✦</span>
        <span className="float-star f2">★</span>
        <span className="float-star f3">✦</span>
        <span className="float-star f4">★</span>
        <span className="float-star f5">✦</span>
        <span className="float-star f6">★</span>
      </div>
    </>
  );
};

export default StarBackground;
