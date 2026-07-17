import MetaService from "../meta.service";
import MetaRepository from "../meta.repository";
import { metaFields } from "../../../data/meta";

// Mock the MetaRepository
jest.mock("../meta.repository");

describe("Meta Service", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("getCounter", () => {
        it("should return all field scores when field is 'all'", async () => {
            // Setup mock data based on metaFields
            const mockRow = {
                totalScore: 100,
                totalProblems: 50,
                totalStudents: 10,
                totalInstitutions: 2,
            };
            
            (MetaRepository.getAllFields as jest.Mock).mockResolvedValue({
                rows: [mockRow]
            });

            const result = await MetaService.getCounter('all');

            expect(MetaRepository.getAllFields).toHaveBeenCalledTimes(1);
            expect(MetaRepository.getField).not.toHaveBeenCalled();
            
            // Expected result should map the metaFields properly
            expect(result).toEqual({
                totalScore: 100,
                totalProblems: 50,
                totalStudents: 10,
                totalInstitutions: 2,
            });
        });

        it("should return a specific field score when field is provided", async () => {
            const requestedField = 'totalScore';
            const mockRow = {
                [requestedField]: 150
            };

            (MetaRepository.getField as jest.Mock).mockResolvedValue({
                rows: [mockRow]
            });

            const result = await MetaService.getCounter(requestedField);

            expect(MetaRepository.getField).toHaveBeenCalledWith(requestedField);
            expect(MetaRepository.getAllFields).not.toHaveBeenCalled();
            
            // Due to how the service wraps single fields: { field: scoreRow[field] }
            expect(result).toEqual({ field: 150 });
        });
    });

    describe("incrementAll", () => {
        it("should call MetaRepository.incrementAllFields with data and return success", async () => {
            const mockData = {
                totalScore: 10,
                totalProblems: 5,
                totalStudents: 1,
                totalInstitutions: 0
            };

            (MetaRepository.incrementAllFields as jest.Mock).mockResolvedValue(true);

            const result = await MetaService.incrementAll(mockData);

            expect(MetaRepository.incrementAllFields).toHaveBeenCalledWith(mockData);
            expect(result).toEqual({ success: true });
        });
    });

    describe("incrementDifference", () => {
        it("should call MetaRepository.incrementDifference with data and return success", async () => {
            const mockData = {
                totalScore: 50,
                totalProblems: 10,
                totalInstitutions: 1
            };

            (MetaRepository.incrementDifference as jest.Mock).mockResolvedValue(true);

            const result = await MetaService.incrementDifference(mockData);

            expect(MetaRepository.incrementDifference).toHaveBeenCalledWith(mockData);
            expect(result).toEqual({ success: true });
        });
    });
});
