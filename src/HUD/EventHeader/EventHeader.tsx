import { Tournament } from "../../API/types";
import tournamentLogo from "../../assets/images/sj-prime-league-season-2-logo.png";
import "./eventheader.scss";

const mockTournament: Tournament = {
  _id: "mock-sj-prime-s2",
  name: "SJ Prime League Season 2",
  logo: tournamentLogo,
  groups: [],
  playoffs: {
    type: "single",
    matchups: [],
    teams: 0,
    phases: 0,
    participants: [],
  },
  autoCreate: false,
  phase: "Group Stage",
};

const getLogoSrc = (logo: string) => {
  if (!logo) return "";
  if (
    logo.startsWith("data:") ||
    logo.startsWith("http") ||
    logo.startsWith("/")
  ) {
    return logo;
  }
  return `data:image/jpeg;base64,${logo}`;
};

/**
 * Renderiza o cabeçalho do evento com dados mockados locais.
 *
 * @returns JSX com nome, logo e fase do torneio.
 * @example
 * <EventHeader />
 */
const EventHeader = () => {
  const tournament = mockTournament;
  const phaseLabel = tournament.phase || tournament.stage || "Main event";
  const logoSrc = getLogoSrc(tournament.logo);

  return (
    <div className="event_header">
      <span className="event_name">{tournament.name}</span>
      {logoSrc ? <img src={logoSrc} alt={tournament.name} /> : null}
      <span className="event_phase">{phaseLabel}</span>
    </div>
  );
};

export default EventHeader;
