- refactor input data structure. it should be Record<ColumnName, ReactNode> instead of some unknown-shape object
this will allow us to ditch some of the props of the table
- move ordering state out of table
- in general make table only do displaying. not data loading, not rendering