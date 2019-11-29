CREATE OR REPLACE FUNCTION add_id_to_movie()
  RETURNS trigger 
  LANGUAGE 'plpgsql'
  AS
$BODY$
BEGIN
    UPDATE public."Movies" SET torrents = array_append(torrents,NEW.id) WHERE imdb_id = NEW.imdb_id;
 
   RETURN NEW;
END;
$BODY$;


DROP TRIGGER IF EXISTS id_to_movie on public."MovieTorrents";

CREATE TRIGGER id_to_movie
  AFTER INSERT OR UPDATE
  ON public."MovieTorrents"
  FOR EACH ROW
  EXECUTE PROCEDURE public.add_id_to_movie();




---------------------------------- Seasons ----------------------------------------

CREATE OR REPLACE FUNCTION add_season_to_shows()
  RETURNS TRIGGER
  LANGUAGE 'plpgsql'
  AS
  $BODY$
  BEGIN
      UPDATE public."Shows" SET latest_season = NEW.season WHERE NEW.season > latest_season AND NEW.imdb_id = imdb_id;
  
    RETURN NEW;
  END;
  $BODY$;


DROP TRIGGER IF EXISTS add_season_to_shows on public."Seasons";

CREATE TRIGGER add_season_to_shows
  AFTER INSERT OR UPDATE
  ON public."Seasons"
  FOR EACH ROW
  EXECUTE PROCEDURE public.add_season_to_shows();




CREATE OR REPLACE FUNCTION add_episode_to_seasons()
  RETURNS TRIGGER
  LANGUAGE 'plpgsql'
  AS
  $BODY$
  BEGIN
      UPDATE public."Seasons" SET latest_episode = NEW.episode WHERE NEW.episode > latest_season AND NEW.imdb_id = imdb_id;

    RETURN NEW;
  END;
  $BODY$;


DROP TRIGGER IF EXISTS add_episode_to_seasons on public."Episodes";

CREATE TRIGGER add_episode_to_seasons
  AFTER INSERT OR UPDATE
  ON public."Episodes"
  FOR EACH ROW
  EXECUTE PROCEDURE public.add_episode_to_seasons();






CREATE OR REPLACE FUNCTION add_torrent_to_episode()
  RETURNS TRIGGER
  LANGUAGE 'plpgsql'
  AS
  $BODY$
  BEGIN
      UPDATE public."Episodes" SET torrents = array_append(torrents,NEW.id) WHERE imdb_id = NEW.imdb_id;
  
    RETURN NEW;
  END;
  $BODY$;


DROP TRIGGER IF EXISTS add_torrent_to_episode ON public."ShowTorrents";

CREATE TRIGGER add_torrent_to_episode
  AFTER INSERT OR UPDATE
  ON public."ShowTorrents"
  FOR EACH ROW
  EXECUTE PROCEDURE public.add_torrent_to_episode();






CREATE OR REPLACE FUNCTION add_full_torrent_to_season()
  RETURNS TRIGGER
  LANGUAGE 'plpgsql'
  AS
  $BODY$
  BEGIN
      UPDATE public."Seasons" SET torrents = array_append(torrents,NEW.id) WHERE imdb_id = NEW.imdb_id;
    
    RETURN NEW;
  END;
  $BODY$;


DROP TRIGGER IF EXISTS add_full_torrent_to_season ON public."FullSeasonTorrents";

CREATE TRIGGER add_full_torrent_to_season
  AFTER INSERT OR UPDATE
  ON public."FullSeasonTorrents"
  FOR EACH ROW
  EXECUTE PROCEDURE public.add_full_torrent_to_season();
