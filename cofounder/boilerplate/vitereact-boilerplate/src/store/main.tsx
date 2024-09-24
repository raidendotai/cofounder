import { configureStore } from "@reduxjs/toolkit";

// Create a Redux store
const store = configureStore({
	reducer: {}, // Empty reducer to prevent crashing
});

// Export the store as default
export default store;