import React, { useState } from "react";
import { Form, InputGroup, Button } from "react-bootstrap";

const SearchBar = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(searchQuery); // Call the onSearch function from the parent component
  };

  return (
    <Form onSubmit={handleSearch} className="mb-4">
      <InputGroup>
        <Form.Control
          type="text"
          placeholder="Search by keyword or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Button variant="primary" type="submit">
          Search
        </Button>
      </InputGroup>
    </Form>
  );
};

export default SearchBar;
