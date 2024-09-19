import {
	configureStore,
	createSlice,
	createAsyncThunk,
	PayloadAction,
} from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux"; // Importing useDispatch and useSelector from react-redux

// Define types directly here as any
type RecipePreview = any;
type RecipeDetails = any;

interface AppState {
	searchQuery: string;
	latestRecipes: RecipePreview[] | null;
	loadingLatestRecipes: boolean;
	latestRecipesError: string | null;
	allRecipes: RecipePreview[] | null;
	loadingAllRecipes: boolean;
	allRecipesError: string | null;
	recipeDetails: RecipeDetails | null;
	loadingRecipeDetails: boolean;
	recipeDetailsError: string | null;
}

// Initial state definition
const initialState: AppState = {
	searchQuery: "",
	latestRecipes: null,
	loadingLatestRecipes: false,
	latestRecipesError: null,
	allRecipes: null,
	loadingAllRecipes: false,
	allRecipesError: null,
	recipeDetails: null,
	loadingRecipeDetails: false,
	recipeDetailsError: null,
};

// Asynchronous Actions (Thunks)
export const fetchLatestRecipes = createAsyncThunk(
	"recipes/fetchLatestRecipes",
	async (_, { rejectWithValue }) => {
		try {
			const response = await fetch("http://localhost:1337/api/v1/recipes/latest");
			if (!response.ok) {
				throw new Error("Failed to fetch latest recipes");
			}
			const data: RecipePreview[] = await response.json();
			return data;
		} catch (error) {
			return rejectWithValue(
				error instanceof Error ? error.message : "Unknown error",
			);
		}
	},
);

export const fetchAllRecipes = createAsyncThunk(
	"recipes/fetchAllRecipes",
	async (
		{ offset = 0, limit = 20 }: { offset?: number; limit?: number },
		{ rejectWithValue },
	) => {
		try {
			const response = await fetch(
				`http://localhost:1337/api/v1/recipes?offset=${offset}&limit=${limit}`,
			);
			if (!response.ok) {
				throw new Error("Failed to fetch recipes");
			}
			const data: RecipePreview[] = await response.json();
			return data;
		} catch (error) {
			return rejectWithValue(
				error instanceof Error ? error.message : "Unknown error",
			);
		}
	},
);

export const fetchRecipeDetails = createAsyncThunk(
	"recipes/fetchRecipeDetails",
	async (id: number, { rejectWithValue }) => {
		try {
			const response = await fetch(`http://localhost:1337/api/v1/recipes/${id}`);
			if (!response.ok) {
				throw new Error("Failed to fetch recipe details");
			}
			const data: RecipeDetails = await response.json();
			return data;
		} catch (error) {
			return rejectWithValue(
				error instanceof Error ? error.message : "Unknown error",
			);
		}
	},
);

// Slice
const recipeSlice = createSlice({
	name: "recipes",
	initialState,
	reducers: {
		setSearchQuery(state, action: PayloadAction<string>) {
			state.searchQuery = action.payload;
		},
		resetAllRecipes(state) {
			state.allRecipes = null;
			state.allRecipesError = null;
			state.loadingAllRecipes = false;
		},
	},
	extraReducers: (builder) => {
		// Latest Recipes
		builder.addCase(fetchLatestRecipes.pending, (state) => {
			state.loadingLatestRecipes = true;
			state.latestRecipesError = null;
		});
		builder.addCase(
			fetchLatestRecipes.fulfilled,
			(state, action: PayloadAction<RecipePreview[]>) => {
				state.latestRecipes = action.payload;
				state.loadingLatestRecipes = false;
			},
		);
		builder.addCase(
			fetchLatestRecipes.rejected,
			(state, action: PayloadAction<any>) => {
				state.loadingLatestRecipes = false;
				state.latestRecipesError = action.payload;
			},
		);

		// All Recipes
		builder.addCase(fetchAllRecipes.pending, (state) => {
			state.loadingAllRecipes = true;
			state.allRecipesError = null;
		});
		builder.addCase(
			fetchAllRecipes.fulfilled,
			(state, action: PayloadAction<RecipePreview[]>) => {
				state.allRecipes = state.allRecipes
					? [...state.allRecipes, ...action.payload]
					: action.payload;
				state.loadingAllRecipes = false;
			},
		);
		builder.addCase(
			fetchAllRecipes.rejected,
			(state, action: PayloadAction<any>) => {
				state.loadingAllRecipes = false;
				state.allRecipesError = action.payload;
			},
		);

		// Recipe Details
		builder.addCase(fetchRecipeDetails.pending, (state) => {
			state.loadingRecipeDetails = true;
			state.recipeDetailsError = null;
		});
		builder.addCase(
			fetchRecipeDetails.fulfilled,
			(state, action: PayloadAction<RecipeDetails>) => {
				state.recipeDetails = action.payload;
				state.loadingRecipeDetails = false;
			},
		);
		builder.addCase(
			fetchRecipeDetails.rejected,
			(state, action: PayloadAction<any>) => {
				state.loadingRecipeDetails = false;
				state.recipeDetailsError = action.payload;
			},
		);
	},
});

// Exports
export const { setSearchQuery, resetAllRecipes } = recipeSlice.actions;

export const store = configureStore({
	reducer: {
		recipes: recipeSlice.reducer,
	},
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Hook to access the redux store within a component
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: (selector: (state: RootState) => any) => any =
	useSelector;

export default store;
