import { useModalRouter } from '@/game/context/ModalRouterContext';
import modalStyles from './Modal.module.css';
import styles from './LeaderboardModal.module.css';
import Button from '@/ui/components/Button';
import Modal from './Modal';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase/client';
import {
  getTopPlayers,
  getNearbyPlayers,
  type LeaderboardPlayer,
  type TopPlayersResult,
  type NearbyPlayersResult,
} from '@/app/actions/user';

const LeaderboardModal = () => {
  const { goBack } = useModalRouter();
  const [topPlayers, setTopPlayers] = useState<TopPlayersResult | null>(null);
  const [nearbyPlayers, setNearbyPlayers] =
    useState<NearbyPlayersResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const user = auth.currentUser;

      const [top, nearby] = await Promise.all([
        getTopPlayers(),
        user ? getNearbyPlayers(user.uid) : Promise.resolve(null),
      ]);

      setTopPlayers(top);
      setNearbyPlayers(nearby);
      setIsLoading(false);
    };

    fetchLeaderboard();
  }, []);

  const renderStarIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <Image
            src='/game/leaderboard/gold-star.svg'
            alt='1st'
            width={20}
            height={20}
          />
        );
      case 2:
        return (
          <Image
            src='/game/leaderboard/silver-star.svg'
            alt='2nd'
            width={20}
            height={20}
          />
        );
      case 3:
        return (
          <Image
            src='/game/leaderboard/bronze-star.svg'
            alt='3rd'
            width={20}
            height={20}
          />
        );
      default:
        return <span className={styles.rank}>{rank + `)`}</span>;
    }
  };

  const renderPlayerRow = (
    player: LeaderboardPlayer,
    isCurrentUser: boolean = false,
    showStars: boolean = false,
  ) => (
    <tr
      key={`${player.rank}-${player.displayName}`}
      className={isCurrentUser ? styles.currentUser : ''}
    >
      <td className={styles.rankCell}>
        {showStars ? (
          renderStarIcon(player.rank)
        ) : (
          <span className={styles.rank}>{player.rank + `)`}</span>
        )}
      </td>
      <td className={styles.nameCell}>
        {isCurrentUser ? 'You' : player.displayName}
      </td>
      <td className={styles.statCell}>{player.combinedScore}</td>
      <td className={styles.statCell}>{player.matchesPlayed}</td>
      <td className={styles.statCell}>{player.dailyStreak}</td>
    </tr>
  );

  return (
    <Modal>
      <div className={modalStyles.content}>
        <h2 className={modalStyles.title}>Leaderboard</h2>

        <div className={styles.wrapper}>
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <table className={styles.leaderboard}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th className={styles.statHeader}>Points</th>
                  <th className={styles.statHeader}>MP</th>
                  <th className={styles.statHeader}>Streak</th>
                </tr>
              </thead>
              <tbody>
                {/* Top 3 players - show stars */}
                {topPlayers?.players.map((player) =>
                  renderPlayerRow(player, false, true),
                )}

                {/* Separator */}
                {nearbyPlayers && nearbyPlayers.current && (
                  <tr className={styles.separator}>
                    <td colSpan={5}>
                      <hr />
                    </td>
                  </tr>
                )}

                {/* Nearby players - show numbers */}
                {nearbyPlayers?.above.map((player) =>
                  renderPlayerRow(player, false, false),
                )}
                {nearbyPlayers?.current &&
                  renderPlayerRow(nearbyPlayers.current, true, false)}
                {nearbyPlayers?.below.map((player) =>
                  renderPlayerRow(player, false, false),
                )}
              </tbody>
            </table>
          )}
        </div>

        <Button fill size='lg' type='button' onClick={goBack}>
          Go Back
        </Button>
      </div>
    </Modal>
  );
};

export default LeaderboardModal;
