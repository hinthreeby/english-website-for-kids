const LoadingDots = ({ label = "Loading" }) => {
  return (
    <div className="loading-wrap" role="status" aria-live="polite">
      <span>{label}</span>
      <span className="dot dot1" />
      <span className="dot dot2" />
      <span className="dot dot3" />
    </div>
  );
};

export default LoadingDots;
