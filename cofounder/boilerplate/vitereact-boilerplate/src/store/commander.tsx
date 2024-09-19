/*
  cmdk <> genui-* <> relayer? store
*/
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";

// Create a Redux store
const store = configureStore({
	reducer: {}, // Add your reducers here
});

// Export the store as default
export default store;
