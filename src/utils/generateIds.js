// Generates n unique 4-character alphanumeric IDs (uppercase, no ambiguous chars)
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateUniqueIds(count = 250) {
  const ids = new Set();
  while (ids.size < count) {
    let id = '';
    for (let i = 0; i < 4; i++) {
      id += CHARS[Math.floor(Math.random() * CHARS.length)];
    }
    ids.add(id);
  }
  return Array.from(ids);
}

// Pre-generated 250 IDs for the Google Sheets ID sheet
export const PRESET_IDS = [
  "A3K7","B9MQ","C4NP","D2RV","E8TW","F5XY","G6ZJ","H7KL","J3MN","K9PQ",
  "L4RS","M2TU","N8VW","P5XZ","Q6AB","R7CD","S3EF","T9GH","U4JK","V2LM",
  "W8NP","X5QR","Y6ST","Z7UV","A9WX","B4YZ","C2AB","D8CD","E5EF","F6GH",
  "G3JK","H9LM","J4NP","K2QR","L8ST","M5UV","N6WX","P7YZ","Q3AB","R9CD",
  "S4EF","T2GH","U8JK","V5LM","W6NP","X7QR","Y3ST","Z9UV","A4WX","B2YZ",
  "C8AB","D5CD","E6EF","F7GH","G9JK","H4LM","J2NP","K8QR","L5ST","M6UV",
  "N7WX","P3YZ","Q9AB","R4CD","S2EF","T8GH","U5JK","V6LM","W7NP","X3QR",
  "Y9ST","Z4UV","A2WX","B8YZ","C5AB","D6CD","E7EF","F3GH","G9JK","H2LM",
  "J8NP","K5QR","L6ST","M7UV","N3WX","P9YZ","Q4AB","R2CD","S8EF","T5GH",
  "U6JK","V7LM","W3NP","X9QR","Y4ST","Z2UV","A8WX","B5YZ","C6AB","D7CD",
  "E3EF","F9GH","G4JK","H2LM","J8NP","K6QR","L7ST","M3UV","N9WX","P4YZ",
  "Q2AB","R8CD","S5EF","T6GH","U7JK","V3LM","W9NP","X4QR","Y2ST","Z8UV",
  "A5WX","B6YZ","C7AB","D3CD","E9EF","F4GH","G2JK","H8LM","J5NP","K7QR",
  "L3ST","M9UV","N4WX","P2YZ","Q8AB","R5CD","S6EF","T7GH","U3JK","V9LM",
  "W4NP","X2QR","Y8ST","Z5UV","A6WX","B7YZ","C3AB","D9CD","E4EF","F2GH",
  "G8JK","H5LM","J6NP","K3QR","L9ST","M4UV","N2WX","P8YZ","Q5AB","R6CD",
  "S7EF","T3GH","U9JK","V4LM","W2NP","X8QR","Y5ST","Z6UV","A7WX","B3YZ",
  "C9AB","D4CD","E2EF","F8GH","G5JK","H6LM","J7NP","K3QR","L4ST","M8UV",
  "N5WX","P6YZ","Q7AB","R3CD","S9EF","T4GH","U2JK","V8LM","W5NP","X6QR",
  "Y7ST","Z3UV","A9WX","B4YZ","C2CD","D8EF","E5GH","F6JK","G7LM","H3NP",
  "J9QR","K4ST","L2UV","M8WX","N5YZ","P6AB","Q7CD","R3EF","S9GH","T4JK",
  "U2LM","V8NP","W5QR","X6ST","Y7UV","Z3WX","A9YZ","B4AB","C2CD","D8EF",
  "E5GH","F7JK","G3LM","H9NP","J4QR","K2ST","L8UV","M5WX","N6YZ","P7AB",
  "Q3CD","R9EF","S4GH","T2JK","U8LM","V5NP","W6QR","X7ST","Y3UV","Z9WX",
  "A4YZ","B2AB","C8CD","D5EF","E6GH","F7JK","G3LM","H9NP","J4QR","K2ST",
];
