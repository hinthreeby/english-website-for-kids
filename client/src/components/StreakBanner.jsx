const StreakBanner = ({ streak }) => {
  return (
    <div className="badge-pill">
      <span aria-hidden="true">🔥</span>
      <span>{streak} Day Streak</span>
    </div>
  );
};

export default StreakBanner;
