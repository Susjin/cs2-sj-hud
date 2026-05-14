import { Timer } from "../MatchBar/MatchBar";
import { Player } from "csgogsi";
import * as I from "../../assets/Icons";
import { MAX_TIMER } from "./Countdown";

interface IProps {
  timer: Timer | null;
  side: "right" | "left";
}

const getCaption = (type: "defusing" | "planting", player: Player | null) => {
  if (!player) return null;
  if (type === "defusing") {
    return (
      <>
        <I.Defuse height={22} width={22} fill="var(--color-new-ct)" />
        <div>{player.name}&nbsp;</div>
        <div className={"CT"}>is defusing</div>
      </>
    );
  }
  return (
    <>
      <I.SmallBomb height={22} fill="var(--color-new-t)" />
      <div>{player.name}&nbsp;</div>
      <div className={"T"}> is planting</div>
    </>
  );
};
const Bomb = ({ timer, side }: IProps) => {
  if (!timer) return null;
  return (
    <div
      className={`defuse_plant_container ${side} ${
        timer && timer.active ? "show" : "hide"
      }`}
    >
      {timer ? (
        <div className={`defuse_plant_caption`}>
          {getCaption(timer.type, timer.player)}
        </div>
      ) : null}

      <div
        className="defuse_plant_bar"
        style={{
          width: `${
            (timer.time * 100) /
            (timer.type === "planting"
              ? MAX_TIMER.planting
              : timer.player?.state.defusekit
              ? MAX_TIMER.defuse_kit
              : MAX_TIMER.defuse_nokit)
          }%`,
        }}
      ></div>
    </div>
  );
};
export default Bomb;
