import { OnlineModel } from '../component/online/OnlineSettings';

export interface ImportResult {
  success: boolean;
  message: string;
  models?: OnlineModel[];
}

export const validateModel = (model: any): boolean => {
  return (
    typeof model.provider === 'string' &&
    typeof model.url === 'string' &&
    typeof model.model === 'string' &&
    typeof model.apiKey === 'string' &&
    typeof model.supportsVision === 'boolean'
  );
};

export const parseModelJson = (jsonString: string): ImportResult => {
  try {
    const data = JSON.parse(jsonString);
    
    if (!Array.isArray(data)) {
      return {
        success: false,
        message: '导入的数据必须是模型数组'
      };
    }

    const models = data as OnlineModel[];
    const invalidModels = models.filter(model => !validateModel(model));

    if (invalidModels.length > 0) {
      return {
        success: false,
        message: '部分模型数据格式不正确'
      };
    }

    return {
      success: true,
      message: '成功导入模型数据',
      models
    };
  } catch (error) {
    return {
      success: false,
      message: '解析JSON数据失败'
    };
  }
};