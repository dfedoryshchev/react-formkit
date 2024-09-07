import React from 'react'
import { Formik, Form, Field } from 'formik'

const FormikForm = () => {
    const initialValues = {
        name: '',
        email: '',
        role: 'dev',
    }

    return (
        <Formik
            initialValues={initialValues}
            onSubmit={(values) => {
                alert(JSON.stringify(values, null, 2))
            }}
        >
            <Form>
                <div>
                    <label htmlFor="name">Name</label>
                    <Field id="name" name="name" />
                </div>
                <div>
                    <label htmlFor="email">Email</label>
                    <Field id="email" name="email" type="email" />
                </div>
                <div>
                    <label htmlFor="role">Role</label>
                    <Field as="select" id="role" name="role">
                        <option value="dev">Developer</option>
                        <option value="pm">PM</option>
                        <option value="qa">QA</option>
                    </Field>
                </div>
                <button type="submit">Submit</button>
            </Form>
        </Formik>
    )
}

export default FormikForm
