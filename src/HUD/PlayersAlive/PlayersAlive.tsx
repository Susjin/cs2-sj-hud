import type { Side } from "csgogsi";
import "./playersalive.scss";

interface PlayersAliveProps {
  leftAlive: number;
  rightAlive: number;
  leftSide: Side;
  rightSide: Side;
}

const PlayersAlive = ({
  leftAlive,
  rightAlive,
  leftSide,
  rightSide,
}: PlayersAliveProps) => (
  <div className="players_alive">
    <div className="counter_container">
      <div className={`team_counter ${leftSide}`}>{leftAlive}</div>
      <div className="title_container">Players left</div>
      <div className={`team_counter ${rightSide}`}>{rightAlive}</div>
    </div>
  </div>
);

export default PlayersAlive;
