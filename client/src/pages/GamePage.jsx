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
import SpacePronounce from "../games/SpacePronounce";

const componentMap = {
  "abc-letters": ABCLetters,
  "picture-words": PictureWords,
  "count-learn": CountLearn,
  "color-fun": ColorFun,
  "animal-sounds": AnimalSounds,
  "match-it": MatchIt,
  "space-pronounce": SpacePronounce,
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
        <GameComponent
          onComplete={({ stars, mistakes, ...extra }) => {
            navigate("/completion", {
              state: {
                stars,
                mistakes,
                gameId,
                gameName: game.name,
                theme: game.theme,
                ...extra,
              },
            });
          }}
        />
      </div>
    </div>
  );
};

export default GamePage;
