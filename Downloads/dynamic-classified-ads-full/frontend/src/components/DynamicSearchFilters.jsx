import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, FormControl, FormLabel, Input, Select, Checkbox, 
         NumberInput, NumberInputField, NumberInputStepper, 
         NumberIncrementStepper, NumberDecrementStepper,
         FormErrorMessage, Stack, Text, Flex, 
         RangeSlider, RangeSliderTrack, RangeSliderFilledTrack, 
         RangeSliderThumb, HStack, Button, Collapse } from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Component for rendering dynamic search filters based on category fields
const DynamicSearchFilters = ({ 
  categoryId, 
  filters, 
  onFilterChange, 
  language = 'ar' 
}) => {
  const { t } = useTranslation();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(true);

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
        // Filter fields that should be shown in filters
        const filterFields = data.filter(field => field.showInFilters);
        // Sort fields by order
        const sortedFields = filterFields.sort((a, b) => a.order - b.order);
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
    return <Box color="red.500">{t('error.fetchingFilters')}: {error}</Box>;
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

  // Render filter based on field type
  const renderFilter = (field) => {
    const fieldName = field.name;
    const fieldValue = filters[fieldName] || '';

    switch (field.fieldType) {
      case 'TEXT':
        return (
          <FormControl key={field.id} mb={4}>
            <FormLabel>{getFieldLabel(field)}</FormLabel>
            <Input
              value={fieldValue}
              onChange={(e) => {
                onFilterChange(fieldName, e.target.value);
              }}
              placeholder={t('search.filterPlaceholder')}
            />
          </FormControl>
        );

      case 'NUMBER':
        return (
          <FormControl key={field.id} mb={4}>
            <FormLabel>{getFieldLabel(field)}</FormLabel>
            <NumberInput
              value={fieldValue}
              onChange={(valueString) => {
                onFilterChange(fieldName, parseFloat(valueString) || 0);
              }}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
        );

      case 'SELECT':
        return (
          <FormControl key={field.id} mb={4}>
            <FormLabel>{getFieldLabel(field)}</FormLabel>
            <Select
              value={fieldValue}
              onChange={(e) => {
                onFilterChange(fieldName, e.target.value);
              }}
              placeholder={t('search.all')}
            >
              {field.options.map((option) => (
                <option key={option.id} value={option.value}>
                  {getOptionLabel(option)}
                </option>
              ))}
            </Select>
          </FormControl>
        );

      case 'MULTISELECT':
        return (
          <FormControl key={field.id} mb={4}>
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
                    onFilterChange(fieldName, currentValues);
                  }}
                >
                  {getOptionLabel(option)}
                </Checkbox>
              ))}
            </Stack>
          </FormControl>
        );

      case 'BOOLEAN':
        return (
          <FormControl key={field.id} mb={4}>
            <Checkbox
              isChecked={!!fieldValue}
              onChange={(e) => {
                onFilterChange(fieldName, e.target.checked);
              }}
            >
              {getFieldLabel(field)}
            </Checkbox>
          </FormControl>
        );

      case 'DATE':
        return (
          <FormControl key={field.id} mb={4}>
            <FormLabel>{getFieldLabel(field)}</FormLabel>
            <Box border="1px solid" borderColor="gray.200" borderRadius="md" p={2}>
              <DatePicker
                selected={fieldValue ? new Date(fieldValue) : null}
                onChange={(date) => {
                  onFilterChange(fieldName, date);
                }}
                dateFormat="yyyy-MM-dd"
                className="w-full"
                placeholderText={t('search.selectDate')}
              />
            </Box>
          </FormControl>
        );

      case 'RANGE':
        const minValue = fieldValue?.min || 0;
        const maxValue = fieldValue?.max || 100;
        const validationRules = field.validationRules || {};
        const absoluteMin = validationRules.min !== undefined ? validationRules.min : 0;
        const absoluteMax = validationRules.max !== undefined ? validationRules.max : 1000;

        return (
          <FormControl key={field.id} mb={4}>
            <FormLabel>{getFieldLabel(field)}</FormLabel>
            <Box pt={6} pb={2}>
              <RangeSlider
                aria-label={['min', 'max']}
                defaultValue={[minValue, maxValue]}
                min={absoluteMin}
                max={absoluteMax}
                onChange={(values) => {
                  onFilterChange(fieldName, { min: values[0], max: values[1] });
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
          </FormControl>
        );

      default:
        return null;
    }
  };

  return (
    <Box 
      borderWidth="1px" 
      borderRadius="lg" 
      p={4} 
      mb={4} 
      bg="white"
      boxShadow="sm"
    >
      <Flex 
        justifyContent="space-between" 
        alignItems="center" 
        mb={4} 
        cursor="pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Text fontSize="lg" fontWeight="bold">
          {t('search.filters')}
        </Text>
        <Button variant="ghost" size="sm">
          {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </Button>
      </Flex>
      
      <Collapse in={isOpen} animateOpacity>
        {fields.map(renderFilter)}
        
        <Button 
          mt={4} 
          colorScheme="blue" 
          size="sm"
          onClick={() => {
            // Reset all filters
            const resetFilters = {};
            fields.forEach(field => {
              resetFilters[field.name] = null;
            });
            
            // Apply reset
            Object.keys(resetFilters).forEach(key => {
              onFilterChange(key, null);
            });
          }}
        >
          {t('search.resetFilters')}
        </Button>
      </Collapse>
    </Box>
  );
};

export default DynamicSearchFilters;
