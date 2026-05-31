import {
    useEffect,
    useState,
} from "react";


import {
    adminQuestionService,
} from "@/services/adminQuestionService";


export function AdminQuestionBuilderPage(
    {
        opportunityId,
    }: {
        opportunityId: string;
    }
) {


    const [
        questions,
        setQuestions,
    ]
        =
        useState<any[]>([]);


    const [
        original,
        setOriginal,
    ]
        =
        useState<any[]>([]);



    useEffect(
        () => {

            load();

        },
        []
    );



    async function load() {

        const data =
            await adminQuestionService
                .getQuestions(
                    opportunityId
                );


        const formatted =
            data.map(
                (q: any) => ({

                    question_id:
                        q.question_id,


                    question_title:
                        q.question_title,


                    question_type:
                        q.question_type,


                    is_required:
                        q.is_required,


                    options:
                        q.opportunity_question_options
                            ?.map(
                                (o: any) =>
                                    o.option_text
                            )
                        ||
                        []

                })
            );


        setQuestions(
            formatted
        );


        setOriginal(
            formatted
        );

    }




    function updateQuestion(
        index: number,
        field: string,
        value: any
    ) {

        const copy =
            [...questions];


        copy[index] = {
            ...copy[index],
            [field]: value,
        };


        setQuestions(copy);

    }




    function addQuestion() {

        setQuestions(
            [
                ...questions,

                {
                    question_title: "",
                    question_type: "text",
                    is_required: false,
                    options: [],
                }

            ]
        );

    }



    function deleteQuestion(
        index: number
    ) {

        setQuestions(
            questions.filter(
                (_, i) => i !== index
            )
        );

    }




    function duplicateQuestion(
        index: number
    ) {

        setQuestions(
            [
                ...questions,

                {
                    ...questions[index],
                    question_id: null,
                }

            ]

        );

    }




    const changed =
        JSON.stringify(
            questions
        )
        !==

        JSON.stringify(
            original
        );




    return (

        <div className="mx-auto max-w-4xl p-8">


            <h1 className="text-2xl font-bold">

                Question Builder

            </h1>



            <button

                className="border px-4 py-2 mt-5"

                onClick={
                    addQuestion
                }

            >

                + Add Question

            </button>



            <button

                disabled={!changed}

                className="border px-4 py-2 ml-3"

                onClick={
                    async () => {


                        for (
                            const q of questions
                        ) {


                            if (
                                !q.question_title.trim()
                            ) {

                                alert(
                                    "Question cannot be empty"
                                );

                                return;

                            }


                            if (
                                [
                                    "dropdown",
                                    "mcq",
                                    "checkbox",
                                ]
                                    .includes(
                                        q.question_type
                                    )
                            ) {


                                if (
                                    q.options.length < 2
                                ) {

                                    alert(
                                        "Choice questions need minimum 2 options"
                                    );

                                    return;

                                }


                                if (
                                    q.options.some(
                                        (o: string) =>
                                            !o.trim()
                                    )
                                ) {

                                    alert(
                                        "Option cannot be empty"
                                    );

                                    return;

                                }



                                const unique =
                                    new Set(
                                        q.options
                                            .map(
                                                (o: string) =>
                                                    o.trim()
                                                        .toLowerCase()
                                            )
                                    );



                                if (
                                    unique.size
                                    !== q.options.length
                                ) {

                                    alert(
                                        "Duplicate options found"
                                    );

                                    return;

                                }


                            }


                        }



                        await adminQuestionService
                            .saveQuestions(
                                opportunityId,
                                questions
                            );


                        await load();


                        alert(
                            "Questions Saved"
                        );


                    }
                }

            >

                Save Questions

            </button>




            {

                questions.map(
                    (q, index) => (


                        <div

                            key={index}

                            className="border rounded p-5 mt-5"

                        >


                            <input

                                className="border p-3 w-full"

                                placeholder="Question"

                                value={
                                    q.question_title
                                }

                                onChange={
                                    e =>
                                        updateQuestion(
                                            index,
                                            "question_title",
                                            e.target.value
                                        )
                                }

                            />



                            <select

                                className="border mt-3 p-2"


                                value={
                                    q.question_type
                                }


                                onChange={
                                    e =>
                                        updateQuestion(
                                            index,
                                            "question_type",
                                            e.target.value
                                        )
                                }

                            >


                                <option value="text">
                                    Short Answer
                                </option>

                                <option value="paragraph">
                                    Paragraph
                                </option>

                                <option value="number">
                                    Number
                                </option>

                                <option value="date">
                                    Date
                                </option>

                                <option value="dropdown">
                                    Dropdown
                                </option>

                                <option value="mcq">
                                    Multiple Choice
                                </option>

                                <option value="checkbox">
                                    Checkbox
                                </option>


                            </select>




                            {
                                [
                                    "dropdown",
                                    "mcq",
                                    "checkbox",
                                ]
                                    .includes(
                                        q.question_type
                                    )
                                &&


                                <div className="mt-4">


                                    {
                                        q.options.map(
                                            (
                                                option: string,
                                                optionIndex: number
                                            ) => (


                                                <input

                                                    key={optionIndex}

                                                    className="border p-2 block mt-2"

                                                    value={option}


                                                    placeholder={
                                                        `Option ${optionIndex + 1}`
                                                    }


                                                    onChange={
                                                        e => {


                                                            const options =
                                                                [
                                                                    ...q.options
                                                                ];


                                                            options[
                                                                optionIndex
                                                            ]
                                                                =
                                                                e.target.value;


                                                            updateQuestion(
                                                                index,
                                                                "options",
                                                                options
                                                            );


                                                        }
                                                    }

                                                />


                                            )
                                        )
                                    }



                                    <button

                                        className="mt-2 border px-3"

                                        onClick={
                                            () => {

                                                updateQuestion(
                                                    index,
                                                    "options",
                                                    [
                                                        ...q.options,
                                                        "",
                                                    ]
                                                );

                                            }
                                        }

                                    >

                                        + Option

                                    </button>


                                </div>

                            }




                            <label className="block mt-4">


                                <input

                                    type="checkbox"


                                    checked={
                                        q.is_required
                                    }


                                    onChange={
                                        e =>

                                            updateQuestion(
                                                index,
                                                "is_required",
                                                e.target.checked
                                            )

                                    }

                                />


                                Required


                            </label>




                            <div className="mt-5">


                                <button

                                    className="border px-3"

                                    onClick={
                                        () => duplicateQuestion(index)
                                    }

                                >

                                    Duplicate

                                </button>



                                <button

                                    className="border px-3 ml-3"

                                    onClick={
                                        () => deleteQuestion(index)
                                    }

                                >

                                    Delete

                                </button>


                            </div>


                        </div>


                    )

                )

            }


        </div>


    );

}