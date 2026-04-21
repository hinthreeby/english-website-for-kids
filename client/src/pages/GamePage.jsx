import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import StoryPuppyAdventure from "../games/StoryPuppyAdventure";

const componentMap = {
  "abc-letters": ABCLetters,
  "picture-words": PictureWords,
  "count-learn": CountLearn,
  "color-fun": ColorFun,
  "animal-sounds": AnimalSounds,
  "match-it": MatchIt,
  "space-pronounce": SpacePronounce,
  "funny-animals": FunnyAnimals,
  "clean-ocean-hero": CleanOceanHero,
  "story-puppy-adventure": StoryPuppyAdventure,
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

  const wrapperClassName =
    gameId === "story-puppy-adventure" ? "game-page-wrap story-page-wrap" : "game-page-wrap";

  return (
    <div className="screen with-bg">
      <Navbar />
      <div className={wrapperClassName}>
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
