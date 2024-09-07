import React from 'react'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'

const validationSchema = Yup.object({
    name: Yup.string().required('Name is required').min(2, 'Too short'),
    email: Yup.string().email('Invalid email').required('Email is required'),
    role: Yup.string().required('Select a role'),
})

const FormikForm = () => {
    const initialValues = {
        name: '',
        email: '',
        role: '',
    }

    return (
        <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={(values) => {
                alert(JSON.stringify(values, null, 2))
            }}
        >
            {({ errors, touched }) => (
                <Form>
                    <div>
                        <label htmlFor="name">Name</label>
                        <Field id="name" name="name" />
                        <ErrorMessage name="name" component="span" style={{ color: 'red' }} />
                    </div>
                    <div>
                        <label htmlFor="email">Email</label>
                        <Field id="email" name="email" type="email" />
                        <ErrorMessage name="email" component="span" style={{ color: 'red' }} />
                    </div>
                    <div>
                        <label htmlFor="role">Role</label>
                        <Field as="select" id="role" name="role">
                            <option value="">-- select --</option>
                            <option value="dev">Developer</option>
                            <option value="pm">PM</option>
                            <option value="qa">QA</option>
                        </Field>
                        <ErrorMessage name="role" component="span" style={{ color: 'red' }} />
                    </div>
                    <button type="submit">Submit</button>
                </Form>
            )}
        </Formik>
    )
}

export default FormikForm
