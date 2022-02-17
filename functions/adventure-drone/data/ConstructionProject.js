/*
  A construction project is built from a schematic, but includes the items that the user is adding.
  We key the items by index (because a schematic has a `parts` array).
  TODO This could be an issue if a schematic changes.
  {
    schematicUid: '',
    parts: [
      <partUid>, // First part in schematic's `parts` array
      <partUid>  // Second part...
    ]
  }
*/
function ConstructionProject(schematic) {
  return {
    schematicUid: schematic.uid,
    partIds: new Array(schematic.data.parts.length).fill('')
  };
}

module.exports = ConstructionProject;
