import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { vendorService } from './vendor.service.js';

const createVendorProfile = asyncHandler(async (req, res) => {
    const result = await vendorService.createVendorProfile(
        req.user,
        req.validatedData.body,
    );

    return sendResponse(
        res,
        201,
        'Vendor profile created successfully.',
        result,
    );
});

const getMyVendorProfile = asyncHandler(async (req, res) => {
    const result = await vendorService.getMyVendorProfile(req.user);

    return sendResponse(
        res,
        200,
        'Vendor profile fetched successfully.',
        result,
    );
});

export const vendorController = {
    createVendorProfile,
    getMyVendorProfile,
};
