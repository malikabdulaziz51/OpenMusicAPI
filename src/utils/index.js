const mapSongDBToModel = ({ id, title, performer }) => ({
  id,
  title,
  performer,
});

const mapDetailSongDBToModel = ({
  id,
  title,
  year,
  performer,
  genre,
  duration,
  albumId,
}) => ({
  id,
  title,
  year,
  performer,
  genre,
  duration,
  albumId,
});

const mapDetailAlbumDBToModel = ({ id, name, year, songs, coverUrl }) => ({
  id,
  name,
  year,
  songs: songs?.map(mapSongDBToModel),
  coverUrl,
});

const mapDetailPlaylistSongsDBToModel = ({ id, name, username, songs }) => ({
  id,
  name,
  username,
  songs: songs?.map(mapSongDBToModel),
});

const mapPlaylistActivitiesDBToModel = ({ playlistId, activities }) => ({
  playlistId,
  activities: activities?.map(({ username, title, action, time }) => ({
    username,
    title,
    action,
    time,
  })),
});

module.exports = {
  mapSongDBToModel,
  mapDetailSongDBToModel,
  mapDetailAlbumDBToModel,
  mapDetailPlaylistSongsDBToModel,
  mapPlaylistActivitiesDBToModel,
};
