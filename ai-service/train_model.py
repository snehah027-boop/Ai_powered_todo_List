"""
Train the diary emotion classification model (DistilBERT + GoEmotions).

Run from the ai-service directory:
    python train_model.py

The trained model is saved to models/diary_emotion_model/ for use by main.py.
"""

import os

import numpy as np
import torch
from datasets import load_dataset
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    Trainer,
    TrainingArguments,
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_OUTPUT_DIR = os.path.join(BASE_DIR, "models", "diary_emotion_model")
CHECKPOINT_DIR = os.path.join(BASE_DIR, "models", "checkpoints")
MODEL_NAME = "distilbert-base-uncased"


def compute_metrics(eval_pred):
    logits, true_labels = eval_pred
    predictions = np.argmax(logits, axis=-1)

    precision, recall, f1, _ = precision_recall_fscore_support(
        true_labels,
        predictions,
        average="weighted",
        zero_division=0,
    )
    accuracy = accuracy_score(true_labels, predictions)

    return {
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1": f1,
    }


def main():
    print("Loading GoEmotions dataset...")
    dataset = load_dataset("google-research-datasets/go_emotions", "simplified")

    labels = dataset["train"].features["labels"].feature.names
    id2label = {i: label for i, label in enumerate(labels)}
    label2id = {label: i for i, label in enumerate(labels)}
    print(f"Number of emotions: {len(labels)}")

    print("Loading tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

    def tokenize_function(example):
        return tokenizer(
            example["text"],
            padding="max_length",
            truncation=True,
            max_length=128,
        )

    print("Tokenizing dataset...")
    tokenized_dataset = dataset.map(tokenize_function, batched=True)

    def change_label(example):
        example["label"] = example["labels"][0]
        return example

    tokenized_dataset = tokenized_dataset.map(change_label)
    tokenized_dataset = tokenized_dataset.remove_columns(["text", "labels"])
    tokenized_dataset.set_format("torch")

    print("Loading DistilBERT model...")
    model = AutoModelForSequenceClassification.from_pretrained(
        MODEL_NAME,
        num_labels=len(labels),
        id2label=id2label,
        label2id=label2id,
    )

    training_args = TrainingArguments(
        output_dir=CHECKPOINT_DIR,
        eval_strategy="epoch",
        save_strategy="epoch",
        learning_rate=2e-5,
        per_device_train_batch_size=8,
        per_device_eval_batch_size=8,
        num_train_epochs=3,
        weight_decay=0.01,
        logging_steps=100,
        report_to="none",
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_dataset["train"],
        eval_dataset=tokenized_dataset["validation"],
        compute_metrics=compute_metrics,
    )

    print("Training model...")
    trainer.train()

    print("Evaluating on test set...")
    results = trainer.evaluate(tokenized_dataset["test"])
    print(results)

    os.makedirs(MODEL_OUTPUT_DIR, exist_ok=True)
    model.save_pretrained(MODEL_OUTPUT_DIR)
    tokenizer.save_pretrained(MODEL_OUTPUT_DIR)
    print(f"Model saved to {MODEL_OUTPUT_DIR}")


if __name__ == "__main__":
    main()
