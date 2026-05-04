import { useEffect } from "react";
import { initMouseParticles } from "../lib/mouseParticles";

const useMouseParticles = () => {
  useEffect(() => {
    const destroy = initMouseParticles();
    return destroy;
  }, []);
};

export default useMouseParticles;
