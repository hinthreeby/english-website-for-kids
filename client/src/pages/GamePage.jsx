import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import LoadingDots from "../components/LoadingDots";
import { gameById } from "../data/games";
import ABCLetters from "../games/ABCLetters";
import AnimalSounds from "../games/AnimalSounds";
import ColorFun from "../games/ColorFun";
import CountLearn from "../games/CountLearn";
import MatchIt from "../games/MatchIt";
import PictureWords from "../games/PictureWords";

const componentMap = {
  "abc-letters": ABCLetters,
  "picture-words": PictureWords,
  "count-learn": CountLearn,
  "color-fun": ColorFun,
  "animal-sounds": AnimalSounds,
  "match-it": MatchIt,
};

const GamePage = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const GameComponent = useMemo(() => componentMap[gameId], [gameId]);
  const game = gameById[gameId];

  if (!GameComponent || !game) {
    return (
      <div className="screen with-bg centered">
        <LoadingDots label="Loading game" />
      </div>
    );
  }

  return (
    <div className="screen with-bg">
      <Navbar />
      <div className="game-page-wrap">
        <h1>{game.emoji} {game.name}</h1>
        <GameComponent
          onComplete={({ stars, mistakes }) => {
            navigate("/completion", {
              state: {
                stars,
                mistakes,
                gameId,
                gameName: game.name,
                theme: game.theme,
              },
            });
          }}
        />
      </div>
    </div>
  );
};

export default GamePage;
