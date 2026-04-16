import API from './apiClient';

export const fetchCourses = async (filters = {}) => {
    const { data } = await API.get('/courses', { params: filters });
    return data;
};

export const createCourse = async (courseData, onUploadProgress) => {
    const { data } = await API.post('/courses', courseData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        },
        onUploadProgress,
    });
    return data;
};

export const createCourseOrder = async (courseId) => {
    const { data } = await API.post(`/courses/${courseId}/razorpay/order`);
    return data;
};

export const verifyCoursePayment = async (payload) => {
    const { data } = await API.post(`/courses/${payload.courseId}/razorpay/verify`, payload);
    return data;
};
