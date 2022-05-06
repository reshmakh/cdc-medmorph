import { createReference, getQuestionnaireAnswers, MedplumClient } from '@medplum/core';
import { Communication, Patient, QuestionnaireResponse, ServiceRequest } from '@medplum/fhirtypes';

export async function handler(medplum: MedplumClient, input: QuestionnaireResponse): Promise<any> {
  // Get all of the answers from the questionnaire response
  const answers = getQuestionnaireAnswers(input);

  // Some quick data validation
  const firstName = answers['firstName']?.valueString;
  if (!firstName) {
    console.log('Missing first name');
    return;
  }

  const lastName = answers['lastName']?.valueString;
  if (!lastName) {
    console.log('Missing last name');
  }

  // Create a patient (FHIR Patient)
  const patient = await medplum.createResource<Patient>({
    resourceType: 'Patient',
    name: [
      {
        given: [firstName],
        family: lastName,
      },
    ],
  });

  // Create an order (FHIR ServiceRequest)
  const order = await medplum.createResource<ServiceRequest>({
    resourceType: 'ServiceRequest',
    subject: createReference(patient),
    code: {
      text: 'Order for a test',
    },
  });

  // Create a comment (FHIR Communication)
  if (answers['comment']?.valueString) {
    await medplum.createResource<Communication>({
      resourceType: 'Communication',
      basedOn: [createReference(order)],
      subject: createReference(patient),
      payload: [
        {
          contentString: answers['comment']?.valueString,
        },
      ],
    });
  }
}
