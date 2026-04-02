import {configureStore} from '@reduxjs/toolkit'
import listingReducers from './features/listingSlice'

export const store = configureStore({
    reducer: {
        // Add your reducers here
        listing: listingReducers
    }
})