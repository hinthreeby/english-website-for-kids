import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import LoadingDots from "../components/LoadingDots";
import { gameById } from "../data/games";
import ABCLetters from "../games/ABCLetters";
import AnimalSounds from "../games/AnimalSounds";
import ColorFun from "../games/ColorFun";
import CleanOceanHero from "../games/CleanOceanHero";
import CountLearn from "../games/CountLearn";
import FunnyAnimals from "../games/FunnyAnimals";
import MatchIt from "../games/MatchIt";
import PictureWords from "../games/PictureWords";
import SpacePronounce from "../games/SpacePronounce";
import FamilyPhoto from "../games/FamilyPhoto";
import SchoolFind  from "../games/SchoolFind";
import DrawGuess   from "../games/DrawGuess";
import AiChat      from "../games/AiChat";

const componentMap = {
  "abc-letters":    ABCLetters,
  "picture-words":  PictureWords,
  "count-learn":    CountLearn,
  "color-fun":      ColorFun,
  "animal-sounds":  AnimalSounds,
  "match-it":       MatchIt,
  "space-pronounce": SpacePronounce,
  "funny-animals":  FunnyAnimals,
  "clean-ocean-hero": CleanOceanHero,
  "family-photo":   FamilyPhoto,
  "school-find":    SchoolFind,
  "draw-guess":     DrawGuess,
  "ai-chat":        AiChat,
};

const GamePage = () => {
  const { gameId } = useParams();
  const navigate   = useNavigate();
  const location   = useLocation();
  const unitId     = location.state?.unitId ?? null;

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
                unitId,
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
