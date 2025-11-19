import { apiClientWrapper } from './apiClientWrapper';
import { API_ENDPOINTS } from '@/services/api/endpoints';

export type TimeFilter = 'week' | 'month';

export interface ReportsData {
    summary: SummaryData;
    weekly_top: WeeklyTrendData[];
    categories: CategoryData[];
}

export interface SummaryData {
    total_checklists: number;
    daily_average: number;
    top: {
        total_checklists_value: string;
        total_checklists_percentage: number;
        daily_average_value: string;
        daily_average_percentage: number;
    };
}

export interface WeeklyTrendData {
    date: string;
    day_of_week: string;
    count: number;
}

export interface CategoryData {
    id: number;
    name: string;
    count: number;
    percentage: number;
    color: string;
}

const getDateRange = (period: TimeFilter): { start_date: string; end_date: string } => {
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];

    let startDate: Date;

    switch (period) {
        case 'week':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 6);
            break;
        case 'month':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 29);
            break;
        default:
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 6);
    }

    return {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate
    };
};

export const fetchReportsData = async (period: TimeFilter): Promise<ReportsData> => {
    const { start_date, end_date } = getDateRange(period);

    const endpoint = `${API_ENDPOINTS.CHECKLIST_DASHBOARD}?start_date=${start_date}&end_date=${end_date}`;

    return await apiClientWrapper.get<ReportsData>(endpoint);
};
