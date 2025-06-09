import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, FormControl, FormLabel, Input, Select, Checkbox, 
         NumberInput, NumberInputField, NumberInputStepper, 
         NumberIncrementStepper, NumberDecrementStepper,
         FormErrorMessage, Stack, Text, Flex, RadioGroup, Radio,
         RangeSlider, RangeSliderTrack, RangeSliderFilledTrack, 
         RangeSliderThumb, HStack } from '@chakra-ui/react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Component for rendering dynamic form fields based on category fields
const DynamicFormFields = ({ 
  categoryId, 
  values, 
  onChange, 
  errors, 
  touched,
  language = 'ar' 
}) => {
  const { t } = useTranslation();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch category fields when categoryId changes
  useEffect(() => {
    if (!categoryId) return;

    const fetchCategoryFields = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/category-fields?categoryId=${categoryId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch category fields');
        }
        const data = await response.json();
        // Sort fields by order
        const sortedFields = data.sort((a, b) => a.order - b.order);
        setFields(sortedFields);
        setError(null);
      } catch (err) {
        console.error('Error fetching category fields:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryFields();
  }, [categoryId]);

  if (loading) {
    return <Box>{t('loading')}</Box>;
  }

  if (error) {
    return <Box color="red.500">{t('error.fetchingFields')}: {error}</Box>;
  }

  if (!fields.length) {
    return null;
  }

  // Helper function to get field label in current language
  const getFieldLabel = (field) => {
    return field.labelI18n[language] || field.name;
  };

  // Helper function to get option label in current language
  const getOptionLabel = (option) => {
    return option.labelI18n[language] || option.value;
  };

  // Render field based on its type
  const renderField = (field) => {
    const fieldName = `attributes.${field.name}`;
    const fieldValue = values.attributes?.[field.name] || '';
    const fieldError = errors.attributes?.[field.name];
    const fieldTouched = touched.attributes?.[field.name];
    const isInvalid = fieldTouched && fieldError;

    switch (field.fieldType) {
      case 'TEXT':
        return (
          <FormControl key={field.id} isInvalid={isInvalid} isRequired={field.isRequired} mb={4}>
            <FormLabel>{getFieldLabel(field)}</FormLabel>
            <Input
              name={fieldName}
              value={fieldValue}
              onChange={(e) => {
                onChange({
                  target: {
                    name: fieldName,
                    value: e.target.value
                  }
                });
              }}
            />
            {isInvalid && <FormErrorMessage>{fieldError}</FormErrorMessage>}
          </FormControl>
        );

      case 'NUMBER':
        return (
          <FormControl key={field.id} isInvalid={isInvalid} isRequired={field.isRequired} mb={4}>
            <FormLabel>{getFieldLabel(field)}</FormLabel>
            <NumberInput
              value={fieldValue}
              onChange={(valueString) => {
                onChange({
                  target: {
                    name: fieldName,
                    value: parseFloat(valueString) || 0
                  }
                });
              }}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            {isInvalid && <FormErrorMessage>{fieldError}</FormErrorMessage>}
          </FormControl>
        );

      case 'SELECT':
        return (
          <FormControl key={field.id} isInvalid={isInvalid} isRequired={field.isRequired} mb={4}>
            <FormLabel>{getFieldLabel(field)}</FormLabel>
            <Select
              name={fieldName}
              value={fieldValue}
              onChange={(e) => {
                onChange({
                  target: {
                    name: fieldName,
                    value: e.target.value
                  }
                });
              }}
              placeholder={t('select')}
            >
              {field.options.map((option) => (
                <option key={option.id} value={option.value}>
                  {getOptionLabel(option)}
                </option>
              ))}
            </Select>
            {isInvalid && <FormErrorMessage>{fieldError}</FormErrorMessage>}
          </FormControl>
        );

      case 'MULTISELECT':
        return (
          <FormControl key={field.id} isInvalid={isInvalid} isRequired={field.isRequired} mb={4}>
            <FormLabel>{getFieldLabel(field)}</FormLabel>
            <Stack spacing={2} direction="column">
              {field.options.map((option) => (
                <Checkbox
                  key={option.id}
                  isChecked={Array.isArray(fieldValue) && fieldValue.includes(option.value)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(fieldValue) ? [...fieldValue] : [];
                    if (e.target.checked) {
                      if (!currentValues.includes(option.value)) {
                        currentValues.push(option.value);
                      }
                    } else {
                      const index = currentValues.indexOf(option.value);
                      if (index !== -1) {
                        currentValues.splice(index, 1);
                      }
                    }
                    onChange({
                      target: {
                        name: fieldName,
                        value: currentValues
                      }
                    });
                  }}
                >
                  {getOptionLabel(option)}
                </Checkbox>
              ))}
            </Stack>
            {isInvalid && <FormErrorMessage>{fieldError}</FormErrorMessage>}
          </FormControl>
        );

      case 'BOOLEAN':
        return (
          <FormControl key={field.id} isInvalid={isInvalid} isRequired={field.isRequired} mb={4}>
            <Checkbox
              name={fieldName}
              isChecked={!!fieldValue}
              onChange={(e) => {
                onChange({
                  target: {
                    name: fieldName,
                    value: e.target.checked
                  }
                });
              }}
            >
              {getFieldLabel(field)}
            </Checkbox>
            {isInvalid && <FormErrorMessage>{fieldError}</FormErrorMessage>}
          </FormControl>
        );

      case 'DATE':
        return (
          <FormControl key={field.id} isInvalid={isInvalid} isRequired={field.isRequired} mb={4}>
            <FormLabel>{getFieldLabel(field)}</FormLabel>
            <Box border="1px solid" borderColor="gray.200" borderRadius="md" p={2}>
              <DatePicker
                selected={fieldValue ? new Date(fieldValue) : null}
                onChange={(date) => {
                  onChange({
                    target: {
                      name: fieldName,
                      value: date
                    }
                  });
                }}
                dateFormat="yyyy-MM-dd"
                className="w-full"
              />
            </Box>
            {isInvalid && <FormErrorMessage>{fieldError}</FormErrorMessage>}
          </FormControl>
        );

      case 'RANGE':
        const minValue = fieldValue?.min || 0;
        const maxValue = fieldValue?.max || 100;
        const validationRules = field.validationRules || {};
        const absoluteMin = validationRules.min !== undefined ? validationRules.min : 0;
        const absoluteMax = validationRules.max !== undefined ? validationRules.max : 1000;

        return (
          <FormControl key={field.id} isInvalid={isInvalid} isRequired={field.isRequired} mb={4}>
            <FormLabel>{getFieldLabel(field)}</FormLabel>
            <Box pt={6} pb={2}>
              <RangeSlider
                aria-label={['min', 'max']}
                defaultValue={[minValue, maxValue]}
                min={absoluteMin}
                max={absoluteMax}
                onChange={(values) => {
                  onChange({
                    target: {
                      name: fieldName,
                      value: { min: values[0], max: values[1] }
                    }
                  });
                }}
              >
                <RangeSliderTrack>
                  <RangeSliderFilledTrack />
                </RangeSliderTrack>
                <RangeSliderThumb index={0} />
                <RangeSliderThumb index={1} />
              </RangeSlider>
              <HStack justifyContent="space-between" mt={2}>
                <Text fontSize="sm">{minValue}</Text>
                <Text fontSize="sm">{maxValue}</Text>
              </HStack>
            </Box>
            {isInvalid && <FormErrorMessage>{fieldError}</FormErrorMessage>}
          </FormControl>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Text fontSize="lg" fontWeight="bold" mb={4}>
        {t('additionalInformation')}
      </Text>
      {fields.map(renderField)}
    </Box>
  );
};

export default DynamicFormFields;
