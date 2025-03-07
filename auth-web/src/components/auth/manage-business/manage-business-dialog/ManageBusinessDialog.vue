<template>
  <div id="manage-business-dialog">
    <ModalDialog
      ref="createAffiliationInvitationErrorDialog"
      :title="createAffiliationInvitationErrorTitle"
      :text="createAffiliationInvitationErrorText"
      :show-help="true"
      dialog-class="notify-dialog"
      max-width="640"
      @open-help="openHelp"
    >
      <template #icon>
        <v-icon
          large
          color="error"
        >
          mdi-alert-circle-outline
        </v-icon>
      </template>
      <template #actions>
        <v-btn
          large
          color="primary"
          data-test="dialog-ok-button"
          @click="closeCreateAffiliationInvitationErrorDialog()"
        >
          Close
        </v-btn>
      </template>
    </ModalDialog>
    <v-dialog
      v-model="isDialogVisible"
      attach="#entity-management"
      persistent
      scrollable
      max-width="50rem"
      data-test-tag="add-business"
      @keydown.esc="resetForm(true)"
    >
      <ModalDialog
        ref="authorizationRequestSentDialog"
        dialog-class="notify-dialog"
        max-width="640"
        :show-icon="false"
        :show-help="true"
        @open-help="openHelp"
      >
        <template #title>
          <h1 class="text-left">
            Authorization Email Sent
          </h1>
        </template>
        <template #text>
          <p class="text-left">
            An email was sent to <span class="font-weight-black">{{ businessContactEmail }}</span>
          </p>
          <p class="text-left">
            Confirm your access by clicking the link inside. This will add the business to your Business Registry List.
            The link is valid for 15 minutes.
          </p>
        </template>
        <template #actions>
          <v-btn
            large
            color="primary"
            data-test="dialog-ok-button"
            @click="onAuthorizationRequestSentDialogClose()"
          >
            Close
          </v-btn>
        </template>
      </ModalDialog>

      <ModalDialog
        ref="invitationRequestSentDialog"
        dialog-class="notify-dialog"
        max-width="640"
        :show-icon="false"
        @open-help="openHelp"
      >
        <template #title>
          <h1 class="text-left">
            Request Sent
          </h1>
        </template>
        <template #text>
          <p>Your authorization request has been sent to contacts of <span class="strong">{{ invitationToAccount.name }}</span>.</p>
        </template>
        <template #actions>
          <v-btn
            large
            color="primary"
            data-test="dialog-ok-button"
            @click="onAuthorizationRequestSentDialogClose()"
          >
            Close
          </v-btn>
        </template>
      </ModalDialog>

      <HelpDialog
        ref="helpDialog"
        :helpDialogBlurb="helpDialogBlurb"
      />

      <v-card v-if="!showHelp && !successDialog">
        <v-card-title data-test="dialog-header">
          <h2>Manage a B.C. Business</h2>
        </v-card-title>

        <v-card-text>
          <v-form
            ref="addBusinessForm"
            lazy-validation
            class="mt-0"
          >
            <div class="font-weight-bold mr-2 float-left">
              Business Name:
            </div>
            <div>{{ businessName }}</div>

            <div class="font-weight-bold mr-2 float-left">
              Incorporation Number:
            </div>
            <div>{{ businessIdentifier }}</div>

            <div class="my-2">
              {{ businessHasNoEmailAndNoAuthenticationAndNoAffiliation ?
                'Some required information for this business is missing:' :
                'You must be authorized to manage this business. You can be authorized in one of the following ways:' }}
            </div>

            <v-card
              class="mx-auto"
              flat
            >
              <v-list class="mr-2">
                <v-list-group
                  v-if="showPasscodeOption"
                  id="manage-business-dialog-passcode-group"
                  v-model="passcodeOption"
                  class="top-of-list"
                  eager
                >
                  <template #activator>
                    <v-list-item-title>Use the business {{ passwordText }}</v-list-item-title>
                  </template>
                  <div class="item-content">
                    <v-text-field
                      v-if="isBusinessIdentifierValid"
                      v-model="passcode"
                      filled
                      :label="passcodeLabel"
                      :hint="passcodeHint"
                      persistent-hint
                      :rules="passcodeRules"
                      :maxlength="passcodeMaxLength"
                      autocomplete="off"
                      type="password"
                      class="passcode mt-0 mb-2"
                      :aria-label="passcodeLabel"
                    />
                    <Certify
                      v-if="isBusinessIdentifierValid && isBusinessLegalTypeFirm"
                      :certifiedBy="certifiedBy"
                      entity="registered entity"
                      class="certify"
                      :class="(isBusinessIdentifierValid && showAuthorization) ? 'mt-4 mb-5' : 'mt-6 mb-5'"
                      @update:isCertified="isCertified = $event"
                    />
                  </div>
                </v-list-group>

                <v-list-group
                  v-if="isBusinessLegalTypeFirm"
                  id="manage-business-dialog-proprietor-partner-name-group"
                  v-model="nameOption"
                  class="top-of-list"
                >
                  <template #activator>
                    <v-list-item-title>
                      Use the name of a proprietor or partner
                    </v-list-item-title>
                  </template>
                  <div class="item-content">
                    <v-text-field
                      v-model="proprietorPartnerName"
                      filled
                      label="Proprietor or Partner Name (e.g., Last Name, First Name Middlename)"
                      hint="Name as it appears on the Business Summary or the Statement of Registration"
                      persistent-hint
                      :rules="proprietorPartnerNameRules"
                      maxlength="151"
                      autocomplete="off"
                      aria-label="Proprietor or Partner Name (e.g., Last Name, First Name Middlename)"
                    />
                  </div>
                  <Certify
                    :certifiedBy="certifiedBy"
                    entity="registered entity"
                    class="certify"
                    :class="(isBusinessIdentifierValid && showAuthorization) ? 'mt-4 mb-5' : 'mt-6 mb-5'"
                    @update:isCertified="isCertified = $event"
                  />
                </v-list-group>

                <v-list-group
                  v-if="showEmailOption"
                  id="manage-business-dialog-email-group"
                  v-model="emailOption"
                >
                  <template #activator>
                    <v-list-item-title>
                      Confirm authorization using your {{ computedAddressType }} email address
                      <div
                        v-if="isBusinessLegalTypeCorporationOrBenefitOrCoop"
                        class="subtitle"
                      >
                        (If you forgot or don't have a business {{ passwordText }})
                      </div>
                    </v-list-item-title>
                  </template>
                  <div class="list-body">
                    <div>
                      An email will be sent to the {{ computedAddressType }} contact email of the business:
                    </div>
                    <div><b>{{ businessContactEmail }}</b></div>
                    <div class="mt-1 mr-1 mb-4">
                      To confirm your access, please click on the link in the email. This will add the business to your
                      Business Registry List. The link is valid for 15 minutes.
                    </div>
                  </div>
                </v-list-group>

                <v-list-group
                  v-if="hasAffiliatedAccount && enableDelegationFeature"
                  id="account-authorization-request"
                  v-model="requestAuthBusinessOption"
                >
                  <template #activator>
                    <v-list-item-title>
                      Request authorization from an account currently managing the business
                    </v-list-item-title>
                  </template>
                  <div class="list-body">
                    <AccountAuthorizationRequest
                      :key="accountAuthorizationKey"
                      :business-identifier="initialBusinessIdentifier"
                      :business-name="initialBusinessName"
                      @change-request-access-message="invitationAdditionalMessage=$event"
                      @select-account="selectAccount($event)"
                      @unknown-error="$emit('unknown-error')"
                    />
                  </div>
                </v-list-group>
              </v-list>
              <div
                v-if="noAuthenticationOptions"
                class="list-body contact-us"
              >
                The business doesn't have a password / passcode or email on record. Please contact us for help:
                <ol class="mt-4">
                  <li>
                    <v-icon small>
                      mdi-phone
                    </v-icon>  Canada and U.S. Toll Free: <a href="tel:+1-877-526-1526">1-877-526-1526</a>
                  </li>
                  <li>
                    <v-icon small>
                      mdi-phone
                    </v-icon>  Victoria Office: <a href="tel:250-387-7848">250-387-7848</a>
                  </li>
                  <li>
                    <v-icon small>
                      mdi-email
                    </v-icon>  Email: <a href="mailto:BCRegistries@gov.bc.ca">BCRegistries@gov.bc.ca</a>
                  </li>
                </ol>
                <h4>Hours of Operation:</h4>
                <p>Monday to Friday, 8:30am - 4:30pm Pacific Time</p>
              </div>
            </v-card>
          </v-form>
        </v-card-text>

        <v-card-actions class="form__btns">
          <v-btn
            id="cancel-button"
            large
            outlined
            color="primary"
            @click="resetForm(true)"
          >
            <span>Cancel</span>
          </v-btn>
          <v-btn
            id="add-button"
            :disabled="!isManageButtonEnabled"
            large
            color="primary"
            :loading="isLoading"
            @click="manageBusiness()"
          >
            <span>Manage This Business</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { AffiliationInvitationStatus, CorpTypes, LDFlags } from '@/util/constants'
import { Ref, computed, defineComponent, ref, watch } from '@vue/composition-api'
import { useBusinessStore, useOrgStore, useUserStore } from '@/stores'
import AccountAuthorizationRequest from '@/components/auth/manage-business/manage-business-dialog/AccountAuthorizationRequest.vue'
import AffiliationInvitationService from '@/services/affiliation-invitation.services'
import BusinessService from '@/services/business.services'
import Certify from './Certify.vue'
import CommonUtils from '@/util/common-util'
import { CreateAffiliationInvitation } from '@/models/affiliation-invitation'
import HelpDialog from '@/components/auth/common/HelpDialog.vue'
import LaunchDarklyService from 'sbc-common-components/src/services/launchdarkly.services'
import { LoginPayload } from '@/models/business'
import ModalDialog from '@/components/auth/common/ModalDialog.vue'
import OrgService from '@/services/org.services'
import { StatusCodes } from 'http-status-codes'

export default defineComponent({
  components: {
    AccountAuthorizationRequest,
    Certify,
    HelpDialog,
    ModalDialog
  },
  props: {
    orgId: {
      type: String,
      default: ''
    },
    initialBusinessIdentifier: {
      type: String,
      default: ''
    },
    initialBusinessName: {
      type: String,
      default: ''
    },
    businessLegalType: {
      type: String,
      default: ''
    },
    showBusinessDialog: {
      type: Boolean,
      default: false
    }
  },
  emits: ['hide-manage-business-dialog', 'on-authorization-email-sent-close', 'add-failed-invalid-code',
    'add-failed-no-entity', 'add-failed-passcode-claimed', 'business-already-added', 'unknown-error',
    'show-create-affiliation-invitation-error-dialog', 'affiliation-invitation-pending', 'add-success',
    'on-business-identifier'],
  setup (props, { emit }) {
    // Store and Actions
    const businessStore = useBusinessStore()
    const invitationToAccount = ref({ 'name': null, 'uuid': null })
    const invitationAdditionalMessage = ref('')
    const requestAuthRegistryFormIsValid = ref(false)
    const selectAccount = (event: { name: string, uuid: string }) => {
      if (event?.name && event?.uuid) {
        invitationToAccount.value = event
        requestAuthRegistryFormIsValid.value = true
      }
    }
    // Local variables
    const accountAuthorizationKey = ref(0)
    const businessName = ref('')
    const businessIdentifier = ref('') // aka incorporation number of registration number
    const businessIdentifierRules = ref(null)
    const contactInfo = ref(null)
    const passcode = ref('') // aka password or proprietor/partner
    const proprietorPartnerName = ref('') // aka password or proprietor/partner name
    const folioNumber = ref('')
    const isLoading = ref(false)
    const isCertified = ref(false) // firms only
    const authorizationName = ref('')
    const addBusinessForm = ref<HTMLFormElement>()
    const helpDialog = ref<HelpDialog>()
    const passcodeOption = ref(false)
    const emailOption = ref(false)
    const nameOption = ref(false)
    const requestAuthBusinessOption = ref(false)
    const requestAuthBusinessRegistryOption = ref(false)
    const requestAuthRegistryOption = ref(false)
    const authorizationLabel = 'Legal name of Authorized Person (e.g., Last Name, First Name)'
    const authorizationMaxLength = 100
    const createAffiliationInvitationErrorDialog: Ref<InstanceType<typeof ModalDialog>> = ref(null)
    const authorizationRequestSentDialog: Ref<InstanceType<typeof ModalDialog>> = ref(null)
    const invitationRequestSentDialog: Ref<InstanceType<typeof ModalDialog>> = ref(null)
    const createAffiliationInvitationErrorTitle = ref('')
    const createAffiliationInvitationErrorText = ref('')
    const hasBusinessEmail = ref(false)
    const hasBusinessAuthentication = ref(false)
    const hasAffiliatedAccount = ref(false)
    const orgStore = useOrgStore()

    const enableDelegationFeature = computed(() => {
      return LaunchDarklyService.getFlag(LDFlags.EnableAffiliationDelegation) || false
    })

    const successDialog = computed(() => {
      return invitationRequestSentDialog.value?.isOpen || authorizationRequestSentDialog.value?.isOpen
    })

    const isManageButtonEnabled = computed(() => {
      return (requestAuthBusinessOption.value && requestAuthRegistryFormIsValid.value) ||
        nameOption.value ||
        emailOption.value ||
        passcodeOption.value ||
        false
    })

    const isBusinessLegalTypeFirm = computed(() => {
      return props.businessLegalType === CorpTypes.SOLE_PROP || props.businessLegalType === CorpTypes.PARTNERSHIP
    })

    const isBusinessLegalTypeCorporation = computed(() => {
      return props.businessLegalType === CorpTypes.BC_COMPANY
    })

    const isBusinessLegalTypeBenefit = computed(() => {
      return props.businessLegalType === CorpTypes.BENEFIT_COMPANY
    })

    const isBusinessLegalTypeCoOp = computed(() => {
      return props.businessLegalType === CorpTypes.COOP
    })

    const enableBusinessNrSearch = computed(() => {
      return LaunchDarklyService.getFlag(LDFlags.EnableBusinessNrSearch) || false
    })

    const isBusinessIdentifierValid = computed(() => {
      return CommonUtils.validateIncorporationNumber(businessIdentifier.value)
    })

    const isCooperative = computed(() => {
      return CommonUtils.isCooperativeNumber(businessIdentifier.value)
    })

    const showAuthorization = computed(() => {
      return isBusinessLegalTypeFirm.value && orgStore.isStaffOrSbcStaff
    })

    const isAuthorizationRequestSentDialogOpen = computed(() => {
      return authorizationRequestSentDialog.value?.isOpen
    })

    const certifiedBy = computed(() => {
      const currentUser = useUserStore().currentUser
      return orgStore.isStaffOrSbcStaff ? authorizationName.value : `${currentUser.lastName}, ${currentUser.firstName}`
    })

    const authorizationRules = computed(() => {
      return [
        (v) => !!v || 'Authorization is required'
      ]
    })

    const passcodeLabel = computed(() => {
      if (isBusinessLegalTypeFirm.value) return 'Proprietor or Partner Name (e.g., Last Name, First Name Middlename)'
      if (isCooperative.value) return 'Passcode'
      return 'Password'
    })

    const passcodeHint = computed(() => {
      if (isBusinessLegalTypeFirm.value) return 'Name as it appears on the Business Summary or the Statement of Registration'
      if (isCooperative.value) return 'Passcode must be exactly 9 digits'
      return 'Password must be 8 to 15 characters'
    })

    const passcodeMaxLength = computed(() => {
      if (isBusinessLegalTypeFirm.value) return 150
      if (isCooperative.value) return 9
      return 15
    })

    const proprietorPartnerNameRules = computed(() => {
      return [
        (v) => !!v || 'Proprietor or Partner Name is required',
        (v) => v.length <= 150 || 'Maximum 150 characters'
      ]
    })

    const passcodeRules = computed(() => {
      if (isBusinessLegalTypeFirm.value) {
        return [
          (v) => !!v || 'Proprietor or Partner Name is required',
          (v) => v.length <= 150 || 'Maximum 150 characters'
        ]
      }
      if (isCooperative.value) {
        return [
          (v) => !!v || 'Passcode is required, enter the passcode you have setup in Corporate Online',
          (v) => CommonUtils.validateCooperativePasscode(v) || 'Passcode must be exactly 9 digits'
        ]
      }
      return [
        (v) => !!v || 'Password is required',
        (v) => CommonUtils.validateCorporatePassword(v) || 'Password must be 8 to 15 characters'
      ]
    })

    const passwordText = computed(() => {
      return (isCooperative.value || isBusinessLegalTypeBenefit.value ? 'passcode' : 'password')
    })

    const helpDialogBlurb = computed(() => {
      if (isCooperative.value) {
        return 'If you have not received your Access Letter from BC Registries, or have lost your Passcode, ' +
          'please contact us at:'
      } else {
        const url = 'www.corporateonline.gov.bc.ca'
        return `If you have forgotten or lost your password, please visit <a href="https://${url}">${url}</a> ` +
          'and choose the option "Forgot Company Password", or contact us at:'
      }
    })

    const isBusinessLegalTypeCorporationOrBenefitOrCoop = computed(() => {
      return (isBusinessLegalTypeCorporation.value || isBusinessLegalTypeBenefit.value || isBusinessLegalTypeCoOp.value) && hasBusinessEmail.value
    })

    const isFormValid = computed(() => {
      let isValid = false
      const hasBusinessIdentifier = !!businessIdentifier.value
      const hasPasscode = !!passcode.value
      const hasCertified = !!isCertified.value
      const isCertifiedBy = !!certifiedBy.value
      if (isBusinessLegalTypeCorporationOrBenefitOrCoop.value) {
        isValid = hasBusinessIdentifier && hasPasscode
      } else if (isBusinessLegalTypeFirm.value) {
        isValid = hasBusinessIdentifier && !!proprietorPartnerName.value && hasCertified
      } else {
        const isFirmCertified = !isBusinessLegalTypeFirm.value || hasCertified
        const isIdentifierValidOrFirmCertified = (!(isBusinessIdentifierValid.value && isBusinessLegalTypeFirm.value)) || isCertifiedBy
        const isFormValidated = addBusinessForm.value.validate()
        isValid = hasBusinessIdentifier && hasPasscode && isFirmCertified && isIdentifierValidOrFirmCertified && isFormValidated
      }
      return isValid
    })

    const isDialogVisible = computed(() => {
      return props.showBusinessDialog
    })

    const businessContactEmail = computed(() => {
      return contactInfo.value?.email
    })

    const computedAddressType = computed(() => {
      if (isBusinessLegalTypeCorporationOrBenefitOrCoop.value) {
        return 'registered office'
      } else if (isBusinessLegalTypeFirm.value) {
        return 'business'
      } else {
        return ''
      }
    })

    // Methods
    const closeAuthorizationRequestSentDialog = () => {
      authorizationRequestSentDialog.value?.close()
    }

    const resetForm = (emitCancel = false) => {
      accountAuthorizationKey.value++
      passcode.value = ''
      proprietorPartnerName.value = ''
      authorizationName.value = ''
      passcodeOption.value = false
      emailOption.value = false
      nameOption.value = false
      requestAuthBusinessOption.value = false
      requestAuthRegistryOption.value = false
      requestAuthBusinessRegistryOption.value = false
      // staff workflow, doesn't have this function defined
      addBusinessForm.value?.resetValidation()
      isLoading.value = false
      if (emitCancel) {
        emit('hide-manage-business-dialog')
      }
      businessStore.setRemoveExistingAffiliationInvitation(false)
    }

    const onAuthorizationRequestSentDialogClose = () => {
      invitationRequestSentDialog.value?.close()
      authorizationRequestSentDialog.value?.close()
      emit('on-authorization-email-sent-close', businessIdentifier.value)
    }

    const handleException = (exception) => {
      if (exception.response?.status === StatusCodes.UNAUTHORIZED) {
        emit('add-failed-invalid-code', passcodeLabel.value)
      } else if (exception.response?.status === StatusCodes.NOT_FOUND) {
        emit('add-failed-no-entity')
      } else if (exception.response?.status === StatusCodes.NOT_ACCEPTABLE) {
        emit('add-failed-passcode-claimed')
      } else if (exception.response?.status === StatusCodes.BAD_REQUEST) {
        emit('business-already-added', { name: businessName.value, identifier: businessIdentifier.value })
      } else {
        emit('unknown-error')
      }
    }

    const closeCreateAffiliationInvitationErrorDialog = () => {
      emit('show-create-affiliation-invitation-error-dialog')
      createAffiliationInvitationErrorDialog.value?.close()
    }

    const handleAuthBusinessOption = async () => {
      try {
        const payload = {
          fromOrgId: Number(props.orgId),
          toOrgUuid: invitationToAccount?.value.uuid,
          businessIdentifier: businessIdentifier.value,
          type: 'REQUEST',
          additionalMessage: invitationAdditionalMessage.value
        }
        await AffiliationInvitationService.createInvitation(payload)
        invitationRequestSentDialog.value?.open()
      } catch (err) {
        createAffiliationInvitationErrorTitle.value = 'Error creating authorization invitation request'
        createAffiliationInvitationErrorText.value = 'An error occurred creating authorization invitation.<br/> Please try again later.'
        createAffiliationInvitationErrorDialog.value.open()
      }
    }

    const handleAuthorizationEmailOption = async () => {
      // Sending authorization email
      try {
        const payload: CreateAffiliationInvitation = {
          fromOrgId: Number(props.orgId),
          businessIdentifier: businessIdentifier.value,
          // toOrgId has to be null, as this is a bug on the backend
          toOrgId: null
        }
        const affiliationInvitation = await AffiliationInvitationService.createInvitation(payload)
        if (affiliationInvitation.data.status === AffiliationInvitationStatus.Pending) {
          emit('affiliation-invitation-pending', affiliationInvitation.data.businessIdentifier)
        }
        authorizationRequestSentDialog.value?.open()
      } catch (err) {
        createAffiliationInvitationErrorTitle.value = 'Error Sending Authorization Email'
        createAffiliationInvitationErrorText.value = 'An error occurred sending authorization email. Please try again.'
        createAffiliationInvitationErrorDialog.value.open()
      }
    }

    // Note this can only be triggered by New Request on an existing affiliation invitation with REQUEST type.
    const handleRemoveExistingAffiliationInvitation = async () => {
      const businessStore = useBusinessStore()
      if (!businessStore.removeExistingAffiliationInvitation) {
        return
      }
      try {
        const pendingInvitations = await AffiliationInvitationService.getAffiliationInvitations(
          props.orgId, AffiliationInvitationStatus.Pending) || []
        for (const invitation of pendingInvitations) {
          if (invitation.entity.businessIdentifier === businessIdentifier.value) {
            await AffiliationInvitationService.removeAffiliationInvitation(invitation.id)
          }
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log(err)
      } finally {
        businessStore.setRemoveExistingAffiliationInvitation(false)
      }
    }

    const manageBusiness = async () => {
      await handleRemoveExistingAffiliationInvitation()

      if (requestAuthBusinessOption.value) {
        await handleAuthBusinessOption()
        return
      }

      if (emailOption.value) {
        await handleAuthorizationEmailOption()
        return
      }

      addBusinessForm.value.validate()
      // Adding business to the list
      if (isFormValid.value) {
        isLoading.value = true
        try {
          let businessData: LoginPayload = { businessIdentifier: businessIdentifier.value }
          if (!orgStore.isStaffOrSbcStaff) {
            businessData = {
              ...businessData,
              certifiedByName: authorizationName.value,
              passCode: isBusinessLegalTypeFirm.value ? proprietorPartnerName.value : passcode.value
            }
          }
          const addResponse = await businessStore.addBusiness(businessData)
          // check if add didn't succeed
          if (addResponse?.status !== StatusCodes.CREATED) {
            emit('unknown-error')
          }
          // let parent know that add was successful
          emit('add-success', businessIdentifier.value)
        } catch (exception) {
          handleException(exception)
        } finally {
          resetForm()
        }
      }
    }

    const formatBusinessIdentifier = () => {
      businessIdentifierRules.value = [
        (v) => !!v || 'Incorporation Number or Registration Number is required',
        (v) => CommonUtils.validateIncorporationNumber(v) ||
          'Incorporation Number or Registration Number is not valid'
      ]
      businessIdentifier.value = CommonUtils.formatIncorporationNumber(businessIdentifier.value)
    }

    const openHelp = () => {
      helpDialog.value.open()
    }

    const showHelp = computed(() => {
      return helpDialog.value?.isDialogOpen
    })

    const showEmailOption = computed(() => {
      return (isBusinessLegalTypeCorporationOrBenefitOrCoop.value || isBusinessLegalTypeFirm.value) && businessContactEmail.value &&
       hasBusinessEmail.value
    })

    const businessHasNoEmailAndNoAuthenticationAndNoAffiliation = computed(() => {
      const hasAuthenticationOption = isBusinessLegalTypeCorporationOrBenefitOrCoop.value && hasBusinessAuthentication.value
      return !hasAuthenticationOption && !isBusinessLegalTypeFirm.value && !showEmailOption.value && !hasAffiliatedAccount.value
    })

    const showPasscodeOption = computed(() => {
      const allowableBusinessPasscodeTypes: string = LaunchDarklyService.getFlag(LDFlags.AllowableBusinessPasscodeTypes) || 'BC,SP,GP'
      return allowableBusinessPasscodeTypes.includes(props.businessLegalType) && hasBusinessAuthentication.value
    })

    const noAuthenticationOptions = computed(() => {
      return !((hasAffiliatedAccount.value && enableDelegationFeature.value) ||
        showEmailOption.value || isBusinessLegalTypeFirm.value || showPasscodeOption.value)
    })

    watch(() => props.initialBusinessIdentifier, async (newBusinessIdentifier: string) => {
      if (orgStore.isStaffOrSbcStaff) { return }
      if (newBusinessIdentifier) {
        businessIdentifier.value = newBusinessIdentifier
        businessName.value = props.initialBusinessName
        try {
          const contact = await BusinessService.getMaskedContacts(newBusinessIdentifier)
          contactInfo.value = contact?.data
          hasBusinessEmail.value = true
        } catch (err) {
          hasBusinessEmail.value = false
          contactInfo.value = ''
          if (err.response?.status !== StatusCodes.NOT_FOUND) {
            // eslint-disable-next-line no-console
            console.error(err)
          }
        }
        try {
          const orgsDetails = await OrgService.getOrganizationsNameAndUuidByAffiliation(newBusinessIdentifier)
          hasAffiliatedAccount.value = orgsDetails.length > 0
        } catch (err) {
          hasAffiliatedAccount.value = false
          // eslint-disable-next-line no-console
          console.error(err)
        }
        try {
          const authentication = await BusinessService.getAuthentication(newBusinessIdentifier)
          hasBusinessAuthentication.value = authentication?.data?.hasValidPassCode
        } catch (err) {
          hasBusinessAuthentication.value = true
          if (err.response?.status !== StatusCodes.NOT_FOUND) {
            // eslint-disable-next-line no-console
            console.error(err)
          }
        }
      }
    })

    // Watchers
    watch(businessIdentifier, (newValue) => {
      emit('on-business-identifier', newValue)
    }, { immediate: true })

    watch(() => [businessHasNoEmailAndNoAuthenticationAndNoAffiliation.value, props.showBusinessDialog],
      async ([newValue, showBusinessDialog], [oldValue]) => {
        if (showBusinessDialog && oldValue !== newValue) {
          requestAuthBusinessRegistryOption.value = newValue
        }
      }, { immediate: true })

    // Return the setup data - These will be removed with script setup.
    return {
      accountAuthorizationKey,
      invitationToAccount,
      invitationAdditionalMessage,
      selectAccount,
      successDialog,
      businessHasNoEmailAndNoAuthenticationAndNoAffiliation,
      isManageButtonEnabled,
      requestAuthRegistryOption,
      requestAuthBusinessOption,
      requestAuthBusinessRegistryOption,
      emailOption,
      nameOption,
      passcodeOption,
      isDialogVisible,
      addBusinessForm,
      helpDialog,
      businessName,
      businessIdentifier,
      passcode,
      proprietorPartnerName,
      folioNumber,
      isLoading,
      isCertified,
      authorizationName,
      authorizationLabel,
      authorizationMaxLength,
      hasBusinessEmail,
      hasBusinessAuthentication,
      hasAffiliatedAccount,
      isBusinessLegalTypeFirm,
      computedAddressType,
      isBusinessLegalTypeCorporation,
      isBusinessLegalTypeBenefit,
      isBusinessLegalTypeCoOp,
      enableBusinessNrSearch,
      isBusinessIdentifierValid,
      isCooperative,
      showAuthorization,
      isAuthorizationRequestSentDialogOpen,
      certifiedBy,
      authorizationRules,
      passcodeLabel,
      passcodeHint,
      passcodeMaxLength,
      passcodeRules,
      proprietorPartnerNameRules,
      passwordText,
      helpDialogBlurb,
      isFormValid,
      manageBusiness,
      closeAuthorizationRequestSentDialog,
      resetForm,
      onAuthorizationRequestSentDialogClose,
      formatBusinessIdentifier,
      openHelp,
      businessContactEmail,
      enableDelegationFeature,
      showHelp,
      invitationRequestSentDialog,
      authorizationRequestSentDialog,
      createAffiliationInvitationErrorDialog,
      createAffiliationInvitationErrorTitle,
      createAffiliationInvitationErrorText,
      closeCreateAffiliationInvitationErrorDialog,
      showEmailOption,
      isBusinessLegalTypeCorporationOrBenefitOrCoop,
      showPasscodeOption,
      noAuthenticationOptions
    }
  }
})
</script>

<style lang="scss" scoped>
@import '$assets/scss/ModalDialog.scss';

  .list-body {
    color:#313132;
  }

  .v-tooltip__content {
    background-color: RGBA(73, 80, 87, 0.95) !important;
    color: white !important;
    border-radius: 4px;
    font-size: 12px !important;
    line-height: 18px !important;
    padding: 15px !important;
    letter-spacing: 0;
    max-width: 270px !important;
  }

  .v-tooltip__content:after {
    content: "" !important;
    position: absolute !important;
    top: 50% !important;
    right: 100% !important;
    margin-top: -10px !important;
    border-top: 10px solid transparent !important;
    border-bottom: 10px solid transparent !important;
    border-right: 8px solid RGBA(73, 80, 87, .95) !important;
  }

  .top-tooltip:after {
    top: 100% !important;
    left: 45% !important;
    margin-top: 0 !important;
    border-right: 10px solid transparent !important;
    border-left: 10px solid transparent !important;
    border-top: 8px solid RGBA(73, 80, 87, 0.95) !important;
  }

  .add-business-unordered-list {
    list-style: none;
    padding-left: 1rem;

    li {
      margin-left: 1.5rem;

      &::before {
        content: "\2022";
        display: inline-block;
        width: 1.5em;
        color: $gray9;
        margin-left: -1.5em;
      }
    }
  }

  .underline-dotted {
    border-bottom: dotted;
    border-bottom-width: 2px;
  }

  dl {
    line-height: 2rem;
  }

  // pair up terms and definitions
  dt {
    float: left;
    clear: left;
  }

  .form__btns {
    display: flex;
    justify-content: flex-end;

    .v-btn + .v-btn {
      margin-left: 0.5rem;
    }

    #cancel-button,
    #add-button {
      min-width: 80px !important;
    }

    // override disabled button color
    .v-btn[disabled]:not(.v-btn--flat):not(.v-btn--text):not(.v-btn--outlined) {
      color: white !important;
      background-color: $app-blue !important;
      opacity: 0.4;
    }
  }

  // remove whitespace below error message
  .authorization {
    ::v-deep .v-text-field__details {
      margin-bottom: 0 !important;
    }
  }

  ::v-deep {
    .v-list-group{
      border-bottom: 1px solid rgb(228, 228, 228);
      &.top-of-list{
        border-top: 1px solid rgb(228, 228, 228);
      }
      .item-content{
        color: #000 !important;
      }
    }

    .v-list-item{
      background: $BCgovInputBG;
      height: 4rem !important;
      margin: 0 !important;
    }

    .v-list-item--link>
    .v-list-item__title {
      font-weight: 300 !important;
      margin-left:-1rem !important;
      color: var(--v-primary-base) !important;
      .subtitle {
        line-height: 1.5rem;
        font-size: 9pt;
        color: var(--v-primary-base) !important;
        font-weight: normal;
      }
    }

    .v-list-item--active>
    .v-list-item__title {
      font-weight: 600 !important;
      margin-left:-1rem !important;
      color: #000 !important;
      .subtitle {
        line-height: 1.5rem;
        font-size: 9pt;
        color: #000 !important;
        font-weight: normal;
      }
    }

    .v-list-item__content{
      color: #000 !important;
    }
  }
</style>
