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

const mapDetailAlbumDBToModel = ({ id, name, year, songs }) => ({
  id,
  name,
  year,
  songs: songs?.map(mapSongDBToModel),
});

module.exports = {
  mapSongDBToModel,
  mapDetailSongDBToModel,
  mapDetailAlbumDBToModel,
};
