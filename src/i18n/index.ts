import en from './en'
import zh from './zh'

type Keys =
  | 'gettingBackupsFailed'
  | 'backUp'
  | 'nameLabel'
  | 'namePlaceholder'
  | 'nameErrorMessageEmpty'
  | 'nameErrorMessageDuplicate'
  | 'nameErrorMessageLength'
  | 'nameErrorMessageIllegal'
  | 'descriptionLabel'
  | 'descriptionPlaceholder'
  | 'submitText'
  | 'cancelText'
  | 'backupSucceeded'
  | 'backupFailed'
  | 'quickBackUp'
  | 'quickBackUpMessage'
  | 'okText'
  | 'searchPlaceholder'
  | 'load'
  | 'loadMessage'
  | 'loadingSucceeded'
  | 'loadingFailed'
  | 'remove'
  | 'removeMessage'
  | 'removalSucceeded'
  | 'removalFailed'
  | 'empty'

export type Text = Record<Keys, string>

export type Lang = 'zh' | 'en'

/**
 * Class of i18n text
 */
export class I18n {
  /** Current language */
  lang: Lang
  /** Text content of current language */
  text: Text

  /**
   * Constructor of I18n class
   * @param lang Language
   */
  constructor(lang: Lang) {
    this.setLanguage(lang)
  }

  /**
   * Set current language and corresponding text content
   * @param lang Language
   */
  setLanguage(lang: Lang) {
    this.lang = lang
    this.text = lang === 'en' ? en : zh
  }
}
