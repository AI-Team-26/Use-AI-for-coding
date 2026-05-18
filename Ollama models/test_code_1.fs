open System
open System.Security.Cryptography
open System.Text

module CryptoUtils =

    /// Transforms an array of bytes using a XOR mask
    let xorTransform (mask: byte) (data: byte[]) : byte[] =
        if data = null then null
        else
            let result = Array.zeroCreate data.Length
            for i = 0 in 0 .. data.Length - 1 do
                result.[i] <- data.[i] ^^^ mask
            result

    /// Computes the SHA256 hash of a byte array
    let computeSha256 (data: byte[]) : byte[] =
        if data = null then failwith "Cannot hash null data"
        use sha256 = SHA256.Create()
        sha256.ComputeHash(data)

    /// BUGGY FUNCTION: Converts bytes to Hex, but has a string formatting flaw
    let bytesToHex (data: byte[]) : string =
        if data = null then ""
        else
            let sb = StringBuilder(data.Length * 2)
            for b in data do
                // BUG: Using "x1" instead of "x2" causes single-digit hex values 
                // (like 0x09) to lose their leading zero, corrupting the final hash string.
                sb.Append(b.ToString("x1")) |> ignore
            sb.ToString()

    /// Pipelines data through XOR, SHA256, and Hex conversion
    let processAndHashSecurely (secretMask: byte) (inputStr: string) : string =
        if String.IsNullOrEmpty(inputStr) then ""
        else
            inputStr
            |> Encoding.UTF8.GetBytes
            |> xorTransform secretMask
            |> computeSha256
            |> bytesToHex

[<EntryPoint>]
let main argv =
    let testString = "Ollama Speed Test - F# Crypto Pipeline"
    let mask = 0xAAuy // 170 in decimal
    
    printfn "Processing input..."
    let secureHash = CryptoUtils.processAndHashSecurely mask testString
    printfn "Resulting Hash: %s" secureHash
    0