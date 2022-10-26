import { Text } from '.'

const en: Text = {
  gettingBackupsFailed: 'Getting backups failed, please try later',
  backUp: 'Back up',
  nameLabel: 'Backup name',
  namePlaceholder: 'Name of backup...',
  nameErrorMessageEmpty: 'name is required',
  nameErrorMessageDuplicate: 'Name of backup already exists',
  nameErrorMessageLength: 'The length of the name should be between 3 and 36',
  nameErrorMessageIllegal: 'Backup name can not include \\ / : * ? " < > |',
  descriptionLabel: 'Description',
  descriptionPlaceholder: 'Some description...',
  submitText: 'Submit',
  cancelText: 'Cancel',
  backupSucceeded: 'Backup succeeded',
  backupFailed: 'Backup failed, please try later',
  quickBackUp: 'Quick back up',
  quickBackUpMessage: 'This will craete a backup named by timestamp',
  okText: 'OK',
  searchPlaceholder: 'Search here...',
  load: 'Load',
  loadMessage: `This will overwrite your current archive and it's irreversible, please confirm that you have backed up`,
  loadingSucceeded: 'Loading succeeded',
  loadingFailed: 'Loading failed, please try later',
  remove: 'Remove',
  removeMessage: 'Remove this backup (irreversible)',
  removalSucceeded: 'Removal succeeded',
  removalFailed: 'Removal failed, please try later',
  empty: 'No backup found'
}

export default en
