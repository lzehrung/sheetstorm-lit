export const colValidations = {
    required: (value, data, key) => {
        const isEmpty = value === undefined || value === null || value === '';
        return !isEmpty ? [] : ['This field is required'];
    },
    unique: (value, data, key) => {
        const uniqueValues = new Set(data.map((row) => row[key]));
        return uniqueValues.size === data.length ? [] : ['This field must be unique'];
    },
};
