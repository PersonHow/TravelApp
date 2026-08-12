// FormSheet / ChipSelect 元件測試（jest-expo + testing-library）
// 測「意圖」：兩段式刪除防誤觸、送出行為、選取回傳值——不是只測有沒有渲染
import { fireEvent, render } from '@testing-library/react-native'
import { Text } from 'react-native'
import { ChipSelect, FormSheet } from '@/components/common/FormSheet'

const baseProps = {
  visible: true,
  title: '測試表單',
  onClose: jest.fn(),
  onSubmit: jest.fn(),
}

describe('FormSheet', () => {
  it('顯示標題與內容，按「儲存」觸發 onSubmit', () => {
    const onSubmit = jest.fn()
    const { getByText } = render(
      <FormSheet {...baseProps} onSubmit={onSubmit}>
        <Text>表單內容</Text>
      </FormSheet>,
    )
    getByText('測試表單')
    getByText('表單內容')
    fireEvent.press(getByText('儲存'))
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('submitLabel 可自訂送出鈕文字（AI 規劃流程用）', () => {
    const { getByText, queryByText } = render(
      <FormSheet {...baseProps} submitLabel="開始規劃">
        <Text>x</Text>
      </FormSheet>,
    )
    getByText('開始規劃')
    expect(queryByText('儲存')).toBeNull()
  })

  it('error 有值時顯示錯誤訊息', () => {
    const { getByText } = render(
      <FormSheet {...baseProps} error="欄位缺漏">
        <Text>x</Text>
      </FormSheet>,
    )
    getByText('欄位缺漏')
  })

  it('刪除採兩段式確認：第一下只變「確認刪除？」，再按一下才真的觸發 onDelete', () => {
    const onDelete = jest.fn()
    const { getByText } = render(
      <FormSheet {...baseProps} onDelete={onDelete}>
        <Text>x</Text>
      </FormSheet>,
    )
    fireEvent.press(getByText('刪除'))
    expect(onDelete).not.toHaveBeenCalled()
    fireEvent.press(getByText('確認刪除？'))
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('沒傳 onDelete 就不顯示刪除鈕（新增模式）', () => {
    const { queryByText } = render(
      <FormSheet {...baseProps}>
        <Text>x</Text>
      </FormSheet>,
    )
    expect(queryByText('刪除')).toBeNull()
  })
})

describe('ChipSelect', () => {
  it('點選項以對應 value 呼叫 onChange', () => {
    const onChange = jest.fn()
    const { getByText } = render(
      <ChipSelect
        label="類別"
        options={[
          { value: 'spot', label: '景點' },
          { value: 'food', label: '餐飲' },
        ]}
        value="spot"
        onChange={onChange}
      />,
    )
    fireEvent.press(getByText('餐飲'))
    expect(onChange).toHaveBeenCalledWith('food')
  })
})
